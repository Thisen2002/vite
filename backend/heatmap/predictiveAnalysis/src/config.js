require('dotenv').config();

function parseIntList(str, fallback) {
  if (!str) return fallback;
  const out = String(str)
    .split(',')
    .map(s => Number(String(s).trim()))
    .filter(n => Number.isFinite(n) && n > 0);
  return out.length ? out : fallback;
}

module.exports = {
  PORT: Number(process.env.PREDICTOR_PORT || process.env.PORT || 3897),
  SOURCE_DB_URL: process.env.SOURCE_DB_URL,
  TARGET_DB_URL: process.env.TARGET_DB_URL,
  EXTERNAL_API_URL: process.env.EXTERNAL_API_URL || 'http://localhost:3897/generator/snapshot',
  PREDICTION_INTERVALS: parseIntList(process.env.PREDICTION_INTERVALS, [15,30,60,120]),
  POLL_INTERVAL_MS: Number(process.env.POLL_INTERVAL_MS || 60000),
  MIN_HISTORY_MINUTES: Number(process.env.MIN_HISTORY_MINUTES || 60),
  ALPHA: Number(process.env.ALPHA || 0.6),
  BETA: Number(process.env.BETA || 0.3),
  // Enhancements
  SEASONAL_BLEND: (process.env.SEASONAL_BLEND || 'true').toLowerCase() === 'true',
  SEASONAL_LOOKBACK_DAYS: Number(process.env.SEASONAL_LOOKBACK_DAYS || 7),
  SEASONAL_BIN_MINUTES: Number(process.env.SEASONAL_BIN_MINUTES || 15),
  BLEND_WEIGHT_SHORT: Number(process.env.BLEND_WEIGHT_SHORT || 0.3),
  BLEND_WEIGHT_LONG: Number(process.env.BLEND_WEIGHT_LONG || 0.6),
  BLEND_SWITCH_MIN: Number(process.env.BLEND_SWITCH_MIN || 60),
  WINSORIZE: (process.env.WINSORIZE || 'true').toLowerCase() === 'true',
  WINSOR_LO: Number(process.env.WINSOR_LO || 5),
  WINSOR_HI: Number(process.env.WINSOR_HI || 95),
  LOG1P_TRANSFORM: (process.env.LOG1P_TRANSFORM || 'false').toLowerCase() === 'true'
};
