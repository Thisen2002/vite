// Shared pg Pools to avoid connect/disconnect cost per request
const { Pool } = require('pg');
const cfg = require('../../config/env');

if (!cfg.sourceDbUrl) console.warn('[pools] SOURCE_DB_URL missing; source pool disabled');
if (!cfg.targetDbUrl) console.warn('[pools] TARGET_DB_URL missing; target pool disabled');

const sourcePool = cfg.sourceDbUrl ? new Pool({ connectionString: cfg.sourceDbUrl, max: 10 }) : null;
const targetPool = cfg.targetDbUrl ? new Pool({ connectionString: cfg.targetDbUrl, max: 10 }) : null;

module.exports = { sourcePool, targetPool };
