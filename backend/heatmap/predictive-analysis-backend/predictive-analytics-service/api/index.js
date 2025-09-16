// Main API entry point for predictive analytics service
const express = require('express');
const cors = require('cors');
const predictRouter = require('./predict');
const { createSourceClient } = require('../infrastructure/db/sourceClient');
const { createTargetClient } = require('../infrastructure/db/targetClient');
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
  // interval=minutes to pick which predicted horizon to show; defaults to 30
  const interval = Number(req.query.interval) || 30;
  let src, tgt;
  try {
    src = createSourceClient();
    tgt = createTargetClient();
    await src.connect();
    await tgt.connect();

    // Fetch latest observed per building from source DB
    const latestObs = await src.query(
      `SELECT DISTINCT ON (cs.building_id)
              cs.building_id,
              cs.building_name,
              cs.crowd_count AS current_count,
              cs.ts
         FROM crowd_stream cs
         ORDER BY cs.building_id, cs.ts DESC`
    );

    // Fetch the most recent predictions at requested horizon from target DB
    const preds = await tgt.query(
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

    // Optional: capacities/colors from catalog
    const caps = await src.query('SELECT building_id, capacity, color FROM building_catalog');
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
  } finally {
    try { await src?.end(); } catch {}
    try { await tgt?.end(); } catch {}
  }
});

app.get('/api/building-history/:name', async (req, res) => {
  let src;
  try {
    const name = decodeURIComponent(req.params.name);
    src = createSourceClient();
    await src.connect();
    const { rows } = await src.query(
      `SELECT ts, crowd_count FROM crowd_stream WHERE building_name = $1 AND ts >= NOW() - INTERVAL '2 minutes' ORDER BY ts ASC`,
      [name]
    );
    const out = rows.map(r => ({ timestamp: r.ts.toLocaleTimeString(), current_count: r.crowd_count }));
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch building history', details: e.message });
  } finally {
    try { await src?.end(); } catch {}
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
