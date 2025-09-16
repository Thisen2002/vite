// Generates multi-horizon forecasts
class PredictionGenerator {
  static generate(model, horizons) {
    const predictions = {};
    const confidenceIntervals = {};
    horizons.forEach(horizon => {
  let [pred, lower, upper] = model.predict(horizon);
  // Clamp to non-negative
  pred = Math.max(0, pred);
  lower = Math.max(0, lower);
      confidenceIntervals[horizon] = [lower, upper];
  predictions[horizon] = pred;
    });
    return { predictions, confidenceIntervals };
  }
}
module.exports = PredictionGenerator;
