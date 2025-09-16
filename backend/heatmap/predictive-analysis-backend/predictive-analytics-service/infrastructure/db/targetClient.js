// Target DB client: writes predictions and can serve to the API (crowd_management DB)
const { Client } = require('pg');
const cfg = require('../../config/env');

function createTargetClient() {
  if (!cfg.targetDbUrl) throw new Error('TARGET_DB_URL is not configured');
  return new Client({ connectionString: cfg.targetDbUrl });
}

module.exports = { createTargetClient };
