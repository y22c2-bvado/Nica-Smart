
require('dotenv').config();

const pool = require('./config/db');

async function main() {
  try {
    const result = await pool.query(`
      SELECT id, name, email, role
      FROM users
      ORDER BY id
    `);

    console.table(result.rows);

    if (result.rows.length === 0) {
      console.log('No hay usuarios registrados todavía.');
    }
  } catch (error) {
    console.error('Error consultando usuarios:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();