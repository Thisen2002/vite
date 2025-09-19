function holtForecast(series, h, alpha = 0.6, beta = 0.3) {
  if (!Array.isArray(series) || series.length === 0) return 0;
  if (series.length < 3) return series[series.length - 1] || 0;

  let l = series[0];
  let b = series[1] - series[0];
  for (let t = 1; t < series.length; t++) {
    const x = series[t];
    const l_prev = l;
    l = alpha * x + (1 - alpha) * (l + b);
    b = beta * (l - l_prev) + (1 - beta) * b;
  }
  return Math.max(0, Math.round(l + h * b));
}

module.exports = { holtForecast };
