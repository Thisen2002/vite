// Main ARIMA forecasting engine
const DataPreprocessor = require('./DataPreprocessor');
const ModelTrainer = require('./ModelTrainer');
const PredictionGenerator = require('./PredictionGenerator');
const ForecastResult = require('../models/ForecastResult');
const ModelMetrics = require('../models/ModelMetrics');

class ARIMAEngine {
  constructor() {
    this.modelCache = {};
  }

  predict(timeSeriesData, predictionRequest) {
    // Preprocess data
    const cleaned = DataPreprocessor.clean(timeSeriesData);
    // Train or load model
    let model = this.modelCache[cleaned.zoneId];
    if (!model) {
      const start = Date.now();
      model = ModelTrainer.train(cleaned);
      const trainingTimeMs = Date.now() - start;
      this.modelCache[cleaned.zoneId] = model;
      var metrics = new ModelMetrics(0.9, trainingTimeMs); // Dummy accuracy
    } else {
      var metrics = new ModelMetrics(0.9, 0); // Cached model
    }
    // Generate predictions
    const { predictions, confidenceIntervals } = PredictionGenerator.generate(model, predictionRequest.horizons);
    return new ForecastResult(cleaned.zoneId, predictions, confidenceIntervals, metrics);
  }
}
module.exports = ARIMAEngine;
