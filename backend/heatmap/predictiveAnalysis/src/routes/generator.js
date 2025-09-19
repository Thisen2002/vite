const express = require('express');
const { getAll } = require('../buildings');
const router = express.Router();

router.get('/snapshot', (req, res) => {
  const now = new Date();
  const rows = getAll().map(b => {
    const base = Math.max(0, Math.round(b.capacity * 0.3));
    const jitter = Math.round((Math.random() - 0.5) * (b.capacity * 0.2));
    const count = Math.max(0, Math.min(b.capacity, base + jitter));
    return {
      building_id: b.building_id,
      building_name: b.building_name,
      count,
      ts: now.toISOString()
    };
  });
  res.json(rows);
});

module.exports = router;
