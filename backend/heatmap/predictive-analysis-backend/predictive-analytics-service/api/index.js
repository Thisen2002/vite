// Main API entry point for predictive analytics service
const express = require('express');
const cors = require('cors');
const predictRouter = require('./predict');
// Switch from per-request clients to shared pools
const { sourcePool, targetPool } = require('../infrastructure/db/pools');
const cfg = require('../config/env');

const app = express();
// Frontend expects port 5000 (configurable via env PORT)
const PORT = cfg.port || 5000;

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Enable JSON body parsing

// Mount the /api/predict endpoint
app.use('/api/predict', predictRouter);

// Provide data for HeatMapAnalysis.js expectations
app.get('/api/crowd', async (req, res) => {
  const interval = Number(req.query.interval) || 30;
  try {
    if (!sourcePool || !targetPool) return res.status(500).json({ error: 'DB pools not configured' });
    const latestObs = await sourcePool.query(
      `SELECT DISTINCT ON (cs.building_id)
              cs.building_id,
              cs.building_name,
              cs.crowd_count AS current_count,
              cs.ts
         FROM crowd_stream cs
         ORDER BY cs.building_id, cs.ts DESC`
    );
    const preds = await targetPool.query(
      `SELECT DISTINCT ON (p.building_id)
              p.building_id,
              p.building_name,
              p.prediction_time,
              p.interval_minutes,
              p.predicted_count
         FROM predictions p
        WHERE p.interval_minutes = $1
         ORDER BY p.building_id, p.prediction_time DESC`,
      [interval]
    );
    const caps = await sourcePool.query('SELECT building_id, capacity, color FROM building_catalog');
    const capMap = new Map(caps.rows.map(r => [r.building_id, { capacity: r.capacity, color: r.color }]));
    const predMap = new Map(preds.rows.map(r => [r.building_id, r]));
    const out = latestObs.rows.map(r => {
      const p = predMap.get(r.building_id);
      const meta = capMap.get(r.building_id) || {};
      return {
        buildingId: r.building_id,
        buildingName: r.building_name,
        color: meta.color || '#999999',
        capacity: meta.capacity || 100,
        timestamp: r.ts.toLocaleTimeString(),
        currentCount: r.current_count,
        predictedCount: p?.predicted_count ?? r.current_count,
      };
    });
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load crowd data', details: e.message });
  }
});

app.get('/api/building-history/:name', async (req, res) => {
  try {
    if (!sourcePool) return res.status(500).json({ error: 'Source DB pool not configured' });
    const name = decodeURIComponent(req.params.name);
    const { rows } = await sourcePool.query(
      `SELECT ts, crowd_count FROM crowd_stream WHERE building_name = $1 AND ts >= NOW() - INTERVAL '2 minutes' ORDER BY ts ASC`,
      [name]
    );
    const out = rows.map(r => ({ timestamp: r.ts.toLocaleTimeString(), current_count: r.crowd_count }));
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch building history', details: e.message });
  }
});

// Health/status endpoint
app.get('/api/health', async (req, res) => {
  try {
    if (!sourcePool || !targetPool) return res.status(500).json({ status: 'error', reason: 'Pools not configured' });
    const latestInsert = await sourcePool.query(
      `SELECT building_id, MAX(ts) AS last_ts FROM crowd_stream GROUP BY building_id ORDER BY building_id`
    );
    const latestPreds = await targetPool.query(
      `SELECT interval_minutes, MAX(prediction_time) AS last_prediction FROM predictions GROUP BY interval_minutes ORDER BY interval_minutes`
    );
    res.json({
      status: 'ok',
      generator: latestInsert.rows,
      predictor: latestPreds.rows,
      intervals: cfg.predictionIntervals,
      pollIntervalMs: cfg.pollIntervalMs,
      generatorIntervalMs: cfg.generatorIntervalMs,
      minHistoryMinutes: cfg.minHistoryMinutes
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// Root endpoint for health check
app.get('/', (req, res) => {
  res.send('Predictive Analytics Backend is running.');
});

// Start the backend server
app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});
