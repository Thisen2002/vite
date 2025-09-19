const express = require('express');
const { targetPool } = require('../db/target');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const horizons = String(req.query.horizons || '')
      .split(',')
      .map(s => Number(String(s).trim()))
      .filter(n => Number.isFinite(n) && n > 0);
    const buildingId = req.query.buildingId ? String(req.query.buildingId) : null;

    let sql = `SELECT DISTINCT ON (building_id, horizon_min)
                 building_id, building_name, horizon_min, current_count, predicted_count, model, created_at
               FROM predictions`;
    const where = [];
    const params = [];
    if (horizons.length) { where.push(`horizon_min = ANY($${params.length+1})`); params.push(horizons); }
    if (buildingId) { where.push(`building_id = $${params.length+1}`); params.push(buildingId); }
    if (where.length) sql += ` WHERE ` + where.join(' AND ');
    sql += ` ORDER BY building_id, horizon_min, created_at DESC`;

    const result = await targetPool.query(sql, params);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/latest', async (req, res) => {
  try {
    const result = await targetPool.query(
      `SELECT DISTINCT ON (building_id, horizon_min)
         building_id, building_name, horizon_min, current_count, predicted_count, model, created_at
       FROM predictions
       ORDER BY building_id, horizon_min, created_at DESC`
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
