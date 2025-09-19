const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  res.json({ ok: true, service: 'predictive-analysis' });
});

module.exports = router;
