// Simple in-memory data store and utilities to serve the frontend without DB
const ARIMAEngine = require('../core/services/ARIMAEngine');
const PredictionRequest = require('../core/models/PredictionRequest');
const TimeSeriesData = require('../core/models/TimeSeriesData');

// Static building catalog (IDs aligned with frontend defaults/capacities)
const BUILDINGS = [
  { id: 1, name: 'Faculty Canteen', color: '#ef4444', capacity: 120 },
  { id: 2, name: 'Lecture Hall 1', color: '#f59e0b', capacity: 100 },
  { id: 3, name: 'Drawing Office 1', color: '#10b981', capacity: 150 },
  { id: 4, name: 'Library', color: '#3b82f6', capacity: 200 },
  { id: 5, name: 'Lab 1', color: '#8b5cf6', capacity: 80 },
  { id: 6, name: 'Lecture Hall 2', color: '#ec4899', capacity: 90 },
  { id: 7, name: 'Drawing Office 2', color: '#22d3ee', capacity: 130 },
];

// Per-building minute-level time series (last 60 minutes), seeded on startup
const store = new Map();

function seed() {
  const now = Date.now();
  BUILDINGS.forEach((b, idx) => {
    const timestamps = [];
    const values = [];
    // Start with a base around 60-90 and random walk
    let val = 60 + (idx * 5) + Math.floor(Math.random() * 15);
    for (let i = 59; i >= 0; i--) {
      const t = new Date(now - i * 60000).toISOString();
      // random walk with slight trend
      val = Math.max(0, val + Math.floor(Math.random() * 7) - 3);
      timestamps.push(t);
      values.push(val);
    }
    store.set(b.id, {
      building: b,
      timestamps,
      values,
      lastSampleAt: now - 60000, // ensure immediate append allowed on next minute
    });
  });
}

seed();

// Append a new minute sample if at least 60s passed
function maybeAppendNewSample() {
  const now = Date.now();
  for (const [id, s] of store.entries()) {
    if (now - s.lastSampleAt >= 60000) {
      const last = s.values[s.values.length - 1] || 50;
      // random walk bounded by capacity somewhat
      const cap = s.building.capacity || 150;
      let next = last + Math.floor(Math.random() * 9) - 4; // -4..+4
      next = Math.max(0, Math.min(cap, next));
      const t = new Date(now).toISOString();
      s.timestamps.push(t);
      s.values.push(next);
      if (s.timestamps.length > 240) { // keep at most last 4 hours
        s.timestamps.shift();
        s.values.shift();
      }
      s.lastSampleAt = now;
    }
  }
}

// Compute predictions per building using ARIMA for a given horizon in minutes
function computeSummaries(intervalMinutes = 30) {
  maybeAppendNewSample();
  const engine = new ARIMAEngine();
  const result = [];
  for (const [id, s] of store.entries()) {
    const ts = new TimeSeriesData(`building-${id}`, s.timestamps, s.values);
    const req = new PredictionRequest(`building-${id}`, [intervalMinutes]);
    const forecast = engine.predict(ts, req);
    const predicted = forecast.predictions[intervalMinutes];
    const current = s.values[s.values.length - 1] || 0;
    result.push({
      buildingId: s.building.id,
      buildingName: s.building.name,
      color: s.building.color,
      capacity: s.building.capacity,
      timestamp: new Date().toLocaleTimeString(),
      currentCount: current,
      predictedCount: Math.round(predicted ?? current),
    });
  }
  return result;
}

// Get last ~2 minutes for a building by name
function getHistoryByBuildingName(name) {
  const entry = [...store.values()].find(v => v.building.name === name);
  if (!entry) return [];
  const twoMinAgo = Date.now() - 2 * 60000;
  const out = [];
  for (let i = entry.timestamps.length - 1; i >= 0; i--) {
    const t = new Date(entry.timestamps[i]).getTime();
    if (t < twoMinAgo) break;
    out.push({ timestamp: new Date(t).toLocaleTimeString(), current_count: entry.values[i] });
  }
  return out.reverse();
}

module.exports = {
  BUILDINGS,
  computeSummaries,
  getHistoryByBuildingName,
};
