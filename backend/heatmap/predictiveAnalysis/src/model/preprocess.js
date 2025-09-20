function percentile(values, p) {
  if (!values.length) return 0;
  const v = [...values].sort((a, b) => a - b);
  const rank = (p / 100) * (v.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) return v[lo];
  const w = rank - lo;
  return v[lo] * (1 - w) + v[hi] * w;
}

function winsorize(series, lower = 5, upper = 95) {
  const data = series.map(Number).filter(Number.isFinite);
  if (!data.length) return [];
  const lo = percentile(data, lower);
  const hi = percentile(data, upper);
  return data.map(x => Math.min(hi, Math.max(lo, x)));
}

function transformLog1p(series) {
  return series.map(x => Math.log1p(Math.max(0, x)));
}

function inverseLog1p(value) {
  return Math.expm1(value);
}

module.exports = { winsorize, transformLog1p, inverseLog1p };
