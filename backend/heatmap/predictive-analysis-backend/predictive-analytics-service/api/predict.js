// API endpoint for on-demand ARIMA predictions (not used by frontend; useful for tests)
const express = require('express');
const router = express.Router();
const ARIMAEngine = require('../core/services/ARIMAEngine');
const PredictionRequest = require('../core/models/PredictionRequest');
const TimeSeriesData = require('../core/models/TimeSeriesData');

// POST /api/predict
router.post('/', (req, res) => {
  // Extract input data from the request body
  const { zoneId, timestamps, values, horizons } = req.body;
  // Validate input data
  if (!zoneId || !Array.isArray(timestamps) || !Array.isArray(values) || !Array.isArray(horizons)) {
    return res.status(400).json({ error: 'Missing or invalid input data.' });
  }
  try {
    const timeSeriesData = new TimeSeriesData(zoneId, timestamps, values);
    const predictionRequest = new PredictionRequest(zoneId, horizons);
    const engine = new ARIMAEngine();
    const result = engine.predict(timeSeriesData, predictionRequest);
  res.json({ predictions: result.predictions, metrics: result.metrics });
  } catch (err) {
    res.status(500).json({ error: 'Prediction failed.', details: err.message });
  }
});

module.exports = router;
