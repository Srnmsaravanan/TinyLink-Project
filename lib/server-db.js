const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL not set');
}

let pool;
if (global._pgPool) {
  pool = global._pgPool;
} else {
  pool = new Pool({ connectionString });
  global._pgPool = pool;
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
