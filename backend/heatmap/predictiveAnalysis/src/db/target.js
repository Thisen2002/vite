const { Pool } = require('pg');
const { TARGET_DB_URL } = require('../config');

const targetPool = new Pool({ connectionString: TARGET_DB_URL });

module.exports = { targetPool };
