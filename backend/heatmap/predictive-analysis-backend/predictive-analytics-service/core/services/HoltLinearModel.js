// Simple Holt's Linear Trend (double exponential smoothing) model
// Provides predict(horizon) -> [pred, lower, upper]

class HoltLinearModel {
  constructor(level, trend, rmse, alpha = 0.4, beta = 0.2) {
    this.level = level;
    this.trend = trend;
    this.rmse = rmse || 1; // avoid zero-variance
    this.alpha = alpha;
    this.beta = beta;
  }

  static fit(values, alpha = 0.4, beta = 0.2) {
    if (!values || values.length < 2) {
      const v = values?.[values.length - 1] ?? 0;
      return new HoltLinearModel(v, 0, 1, alpha, beta);
    }
    // Initialize level and trend
    let L = values[0];
    let T = values[1] - values[0];
    const residuals = [];
    for (let t = 1; t < values.length; t++) {
      const y = values[t];
      // one-step forecast using previous L,T
      const yhat = L + T;
      residuals.push(y - yhat);
      // update level/trend
      const prevL = L;
      L = alpha * y + (1 - alpha) * (L + T);
      T = beta * (L - prevL) + (1 - beta) * T;
    }
    // RMSE of one-step errors
    const mse = residuals.reduce((s, e) => s + e * e, 0) / Math.max(1, residuals.length);
    const rmse = Math.sqrt(mse) || 1;
    return new HoltLinearModel(L, T, rmse, alpha, beta);
  }

  predict(horizon) {
    // Point forecast
    const pred = this.level + horizon * this.trend;
    // Simple CI using RMSE * sqrt(h)
    const se = Math.sqrt(Math.max(1, horizon)) * this.rmse;
    const lower = pred - 1.96 * se;
    const upper = pred + 1.96 * se;
    return [pred, lower, upper];
  }
}

module.exports = HoltLinearModel;
