const express = require('express');
const { getAll } = require('../buildings');
const router = express.Router();

// Simple live map data generator for SvgHeatmap.jsx
// Response shape: { data: [ { id, building_id, building_name, building_capacity, count, status_timestamp } ] }
router.get('/map-data', (req, res) => {
  const now = new Date().toISOString();
  const rows = getAll().map(b => {
    const base = Math.max(0, Math.round(b.capacity * 0.3));
    const jitter = Math.round((Math.random() - 0.5) * (b.capacity * 0.2));
    const count = Math.max(0, Math.min(b.capacity, base + jitter));
    return {
      id: b.building_id,
      building_id: b.building_id,
      building_name: b.building_name,
      building_capacity: b.capacity,
      count,
      status_timestamp: now
    };
  });
  res.json({ data: rows });
});

module.exports = router;
