
require('dotenv').config({ path: '../.env' });

const pool = require('./config/db');

async function fixDatabase() {
  try {
    console.log('Revisando la base de datos...');

    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_blocked
      BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    console.log('Columna is_blocked verificada correctamente.');

    const result = await pool.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('users', 'products', 'orders')
      ORDER BY table_name, ordinal_position;
    `);

    console.table(result.rows);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixDatabase();