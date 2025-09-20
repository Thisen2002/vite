// Holt's linear trend with optional damped trend and lightweight hyperparameter tuning.
// Backward-compatible signature: (series, h, alpha, beta, options?)
function holtForecast(series, h, alpha = 0.6, beta = 0.3, options = {}) {
  const data = (Array.isArray(series) ? series : [])
    .map(Number)
    .filter(n => Number.isFinite(n));
  if (data.length === 0) return 0;
  if (data.length < 3) return Math.max(0, Math.round(data[data.length - 1]));

  const clampMin = 0;
  const clampMax = Number.isFinite(options.max) ? options.max : Number.POSITIVE_INFINITY;
  const enableOptimize = options.optimize !== false && data.length >= 6;

  // Damped trend factor candidates; include 1 for classic Holt.
  const phiCandidates = options.phi ? [Number(options.phi)] : [0.9, 0.95, 0.98, 1.0];
  const uniq = arr => Array.from(new Set(arr.filter(v => Number.isFinite(v))));
  const clip01 = v => Math.max(0.01, Math.min(0.99, v));
  const alphaCandidates = uniq([clip01(alpha), 0.2, 0.4, 0.6, 0.8]);
  const betaCandidates = uniq([clip01(beta), 0.1, 0.2, 0.3, 0.4]);

  function initializeLevelTrend(values) {
    const n = values.length;
    // Level: first observation; Trend: average of first few differences for stability.
    let l0 = values[0];
    const m = Math.min(5, n - 1);
    if (m <= 0) return { l: l0, b: 0 };
    let sumDiff = 0;
    for (let i = 1; i <= m; i++) sumDiff += (values[i] - values[i - 1]);
    const b0 = sumDiff / m;
    return { l: l0, b: b0 };
  }

  function smoothAndScore(values, a, b, phi) {
    const { l: lInit, b: bInit } = initializeLevelTrend(values);
    let l = lInit;
    let t = bInit;
    let sse = 0;
    for (let i = 1; i < values.length; i++) {
      const x = values[i];
      const yhat = l + phi * t; // one-step-ahead forecast
      const e = x - yhat;
      sse += e * e;
      const lPrev = l;
      l = a * x + (1 - a) * (l + phi * t);
      t = b * (l - lPrev) + (1 - b) * phi * t;
    }
    return { l, t, sse };
  }

  function hStepForecast(l, t, phi, horizon) {
    if (horizon <= 0) return l;
    if (Math.abs(phi - 1.0) < 1e-6) {
      return l + horizon * t; // classic Holt
    }
    const sum = (phi * (1 - Math.pow(phi, horizon))) / (1 - phi);
    return l + t * sum; // damped trend
  }

  let best = { sse: Number.POSITIVE_INFINITY, l: 0, t: 0, a: alpha, b: beta, phi: 1.0 };
  if (enableOptimize) {
    for (const a of alphaCandidates) {
      for (const bb of betaCandidates) {
        for (const phi of phiCandidates) {
          const { l, t, sse } = smoothAndScore(data, a, bb, phi);
          if (Number.isFinite(sse) && sse < best.sse) best = { sse, l, t, a, b: bb, phi };
        }
      }
    }
  } else {
    const phi = phiCandidates[phiCandidates.length - 1]; // prefer undamped if not optimizing
    const { l, t, sse } = smoothAndScore(data, clip01(alpha), clip01(beta), phi);
    best = { sse, l, t, a: clip01(alpha), b: clip01(beta), phi };
  }

  const raw = hStepForecast(best.l, best.t, best.phi, Math.max(1, Math.round(h)));
  const clamped = Math.max(clampMin, Math.min(clampMax, Math.round(raw)));
  return clamped;
}

module.exports = { holtForecast };
