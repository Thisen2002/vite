// Centralized environment configuration for the backend.
// Loads .env if present (safe for local dev) and exposes typed values with defaults.
require('dotenv').config();

const cfg = {
  port: Number(process.env.PORT || 5000),
  sourceDbUrl: process.env.SOURCE_DB_URL,
  targetDbUrl: process.env.TARGET_DB_URL,
  predictionIntervals: (process.env.PREDICTION_INTERVALS || '1,2,5,10,15,30,60,120')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n) && n > 0),
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS || 120000), // default 2 min
  generatorIntervalMs: Number(process.env.GENERATOR_INTERVAL_MS || 60000), // default 1 min
  minHistoryMinutes: Number(process.env.MIN_HISTORY_MINUTES || 60),
};

if (!cfg.sourceDbUrl) {
  console.warn('[env] SOURCE_DB_URL not set. Set it to connect to the source DB.');
}
if (!cfg.targetDbUrl) {
  console.warn('[env] TARGET_DB_URL not set. Set it to connect to the target DB.');
}

module.exports = cfg;
