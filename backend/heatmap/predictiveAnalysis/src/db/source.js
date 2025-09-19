const { Pool } = require('pg');
const { SOURCE_DB_URL } = require('../config');

const sourcePool = new Pool({ connectionString: SOURCE_DB_URL });

module.exports = { sourcePool };
