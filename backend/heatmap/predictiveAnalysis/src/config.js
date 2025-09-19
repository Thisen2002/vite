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
  BETA: Number(process.env.BETA || 0.3)
};
