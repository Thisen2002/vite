
// ModelMetrics is a class for tracking model accuracy and training time
class ModelMetrics {
  /**
   * @param {number} accuracy - The accuracy score of the model (e.g., 0.9 for 90%)
   * @param {number} trainingTimeMs - How long it took to train the model (in milliseconds)
   */
  constructor(accuracy, trainingTimeMs) {
    this.accuracy = accuracy; // Accuracy of predictions
    this.trainingTimeMs = trainingTimeMs; // Training duration in ms
  }
}

// Export the ModelMetrics class for use in ForecastResult and ARIMAEngine
module.exports = ModelMetrics;
