// Source DB client: reads/writes to the real-time crowd stream (crowd_source DB)
const { Client } = require('pg');
const cfg = require('../../config/env');

function createSourceClient() {
  if (!cfg.sourceDbUrl) throw new Error('SOURCE_DB_URL is not configured');
  return new Client({ connectionString: cfg.sourceDbUrl });
}

module.exports = { createSourceClient };
