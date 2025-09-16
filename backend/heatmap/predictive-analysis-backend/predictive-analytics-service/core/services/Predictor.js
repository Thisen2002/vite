// Predictor service: reads history from Source DB, runs ARIMA, writes predictions to Target DB
const cfg = require('../../config/env');
const { createSourceClient } = require('../../infrastructure/db/sourceClient');
const { createTargetClient } = require('../../infrastructure/db/targetClient');
const ARIMAEngine = require('./ARIMAEngine');
const PredictionRequest = require('../models/PredictionRequest');
const TimeSeriesData = require('../models/TimeSeriesData');

async function fetchBuildings(client) {
  const { rows } = await client.query('SELECT building_id, building_name, capacity FROM building_catalog ORDER BY building_id');
  return rows;
}

async function fetchHistory(client, building_id, minutes) {
  // Pull last N minutes; if you ingest per-second data, this will fetch that too
  const { rows } = await client.query(
    `SELECT ts, crowd_count FROM crowd_stream
     WHERE building_id = $1 AND ts >= NOW() - INTERVAL '${minutes} minutes'
     ORDER BY ts ASC`,
    [building_id]
  );
  const timestamps = rows.map(r => r.ts.toISOString());
  const values = rows.map(r => r.crowd_count);
  return { timestamps, values };
}

async function detectPredictionsSchema(target) {
  const { rows } = await target.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'predictions'`
  );
  const cols = new Set(rows.map(r => r.column_name));
  return { hasBuildingName: cols.has('building_name') };
}

async function writePredictions(target, building, predictionTime, intervals, predictions, latestObserved, schemaInfo) {
  for (const interval of intervals) {
    let raw = predictions[interval];
    if (!Number.isFinite(raw)) raw = latestObserved;
    // Capacity clamp if available from catalog metadata
    const capacity = Number(building.capacity) || undefined;
    let clamped = Math.round(raw ?? latestObserved ?? 0);
    if (Number.isFinite(capacity)) {
      clamped = Math.max(0, Math.min(capacity, clamped));
    } else {
      clamped = Math.max(0, clamped);
    }
    // Upsert without relying on a DB-side unique constraint: delete then insert
    await target.query(
  `DELETE FROM predictions WHERE building_id = $1 AND prediction_time = $2 AND interval_minutes = $3`,
      [building.building_id, predictionTime, interval]
    );
    if (schemaInfo?.hasBuildingName) {
      await target.query(
        `INSERT INTO predictions (building_id, building_name, prediction_time, interval_minutes, predicted_count, real_time_count)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [building.building_id, building.building_name, predictionTime, interval, clamped, latestObserved]
      );
    } else {
      await target.query(
        `INSERT INTO predictions (building_id, prediction_time, interval_minutes, predicted_count, real_time_count)
     VALUES ($1,$2,$3,$4,$5)`,
    [building.building_id, predictionTime, interval, clamped, latestObserved]
      );
    }
  }
}

async function runPredictorCycle(source, target) {
  const engine = new ARIMAEngine();
  const buildings = await fetchBuildings(source);
  const predictionTime = new Date();

  for (const b of buildings) {
    const { timestamps, values } = await fetchHistory(source, b.building_id, cfg.minHistoryMinutes);
    if (!values || values.length < 10) {
      // Not enough data — skip or write naive predictions using last observed
      const last = values?.[values.length - 1] ?? 0;
      await writePredictions(target, b, predictionTime, cfg.predictionIntervals, {}, last);
      continue;
    }
    const tsData = new TimeSeriesData(String(b.building_id), timestamps, values);
    const req = new PredictionRequest(String(b.building_id), cfg.predictionIntervals);
    const result = engine.predict(tsData, req);
    const last = values[values.length - 1];
    await writePredictions(target, b, predictionTime, cfg.predictionIntervals, result.predictions, last);
  }
}

async function startPredictor() {
  const source = createSourceClient();
  const target = createTargetClient();
  await source.connect();
  await target.connect();
  console.log('[predictor] connected to source and target DBs');

  // Detect schema once
  const schemaInfo = await detectPredictionsSchema(target);
  // Patch runPredictorCycle to close over schemaInfo
  async function cycle() {
    const engine = new ARIMAEngine();
    const buildings = await fetchBuildings(source);
    const predictionTime = new Date();
    for (const b of buildings) {
      const { timestamps, values } = await fetchHistory(source, b.building_id, cfg.minHistoryMinutes);
      if (!values || values.length < 10) {
        const last = values?.[values.length - 1] ?? 0;
        await writePredictions(target, b, predictionTime, cfg.predictionIntervals, {}, last, schemaInfo);
        continue;
      }
      const tsData = new TimeSeriesData(String(b.building_id), timestamps, values);
  const req = new PredictionRequest(String(b.building_id), cfg.predictionIntervals);
      let result;
      try {
        result = engine.predict(tsData, req);
      } catch (e) {
        // Fall back to latest observed if ARIMA fails
        const last = values[values.length - 1];
        await writePredictions(target, b, predictionTime, cfg.predictionIntervals, {}, last, schemaInfo);
        continue;
      }
  const last = values[values.length - 1];
  await writePredictions(target, b, predictionTime, cfg.predictionIntervals, result.predictions, last, schemaInfo);
    }
  }

  // Run once immediately, then on interval
  await cycle();
  console.log('[predictor] first prediction cycle complete');
  setInterval(async () => {
    try {
      await cycle();
      console.log('[predictor] prediction cycle complete');
    } catch (e) {
      console.error('[predictor] error in prediction cycle', e.message);
    }
  }, cfg.pollIntervalMs);
}

module.exports = { startPredictor };
