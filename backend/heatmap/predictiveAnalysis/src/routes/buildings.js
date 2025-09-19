const express = require('express');
const { getAll } = require('../buildings');
const router = express.Router();

router.get('/', (req, res) => {
  res.json(getAll());
});

module.exports = router;
