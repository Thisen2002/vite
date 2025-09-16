// // Demo: Predictive Analysis ARIMA Engine Usage

// // Generate synthetic data for zone A
// const timeSeriesData = MockDataGenerator.generate('zoneA', 120);
// console.log('Synthetic Data (last 10 values):', timeSeriesData.values.slice(-10));
// console.log('Synthetic Data (timestamps, last 10):', timeSeriesData.timestamps.slice(-10));
// const predictionRequest = new PredictionRequest('zoneA', [2, 5, 15, 30, 60, 120]);

// const engine = new ARIMAEngine();
// const result = engine.predict(timeSeriesData, predictionRequest);

// console.log('Predictions:', result.predictions);
// console.log('Confidence Intervals:', result.confidenceIntervals);
// console.log('Metrics:', result.metrics);

// Boot services and API
require('dotenv').config();
const { startGenerator } = require('./predictive-analytics-service/core/services/DataGenerator');
const { startPredictor } = require('./predictive-analytics-service/core/services/Predictor');

// Start API server (port from env or 5000)
require('./predictive-analytics-service/api/index');

// Start dummy data generator (writes to Source DB) and predictor (reads Source, writes Target)
(async () => {
  try {
    await startGenerator();
    await startPredictor();
  } catch (e) {
    console.error('Startup error:', e.message);
  }
})();
// End of bootstrap