const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '..', '.env')
});

if (!process.env.DATABASE_URL) {
  throw new Error('Falta DATABASE_URL en backend/.env');
}

const isLocalDatabase =
  /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocalDatabase
    ? false
    : { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('Error inesperado en PostgreSQL:', err.message);
});

module.exports = pool;