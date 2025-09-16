
// ForecastResult is a class that stores the output of a prediction
class ForecastResult {
  /**
   * @param {string} zoneId - The zone name or ID
   * @param {Object} predictions - Predicted values for each time horizon
   * @param {Object} confidenceIntervals - Confidence intervals for each prediction
   * @param {Object} metrics - ModelMetrics instance (accuracy, training time)
   */
  constructor(zoneId, predictions, confidenceIntervals, metrics) {
    this.zoneId = zoneId; // The zone identifier
    this.predictions = predictions; // Predictions for each requested interval
    this.confidenceIntervals = confidenceIntervals; // Ranges for prediction reliability
    this.metrics = metrics; // Accuracy and performance info
  }
}

// Export the ForecastResult class for use in ARIMAEngine and server
module.exports = ForecastResult;
