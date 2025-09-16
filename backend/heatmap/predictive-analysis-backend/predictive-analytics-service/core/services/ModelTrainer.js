// Fits forecasting model for zones (Holt's linear trend)
const HoltLinearModel = require('./HoltLinearModel');
class ModelTrainer {
  static train(data) {
  // Fit Holt’s linear trend on cleaned values
  // Optionally we could tune alpha/beta, but defaults are robust
  const model = HoltLinearModel.fit(data.values, 0.4, 0.2);
  return model;
  }
}
module.exports = ModelTrainer;
