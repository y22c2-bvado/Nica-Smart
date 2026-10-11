require('dotenv').config({ path: '../.env' });

const pool = require('./config/db');

async function checkDatabase() {
  try {
    console.log('Conectando a PostgreSQL...\n');

    const columns = await pool.query(`
      SELECT
        table_name,
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('users', 'products', 'orders')
      ORDER BY table_name, ordinal_position;
    `);

    console.log('=== ESTRUCTURA DE LAS TABLAS ===');
    console.table(columns.rows);

    const blockedColumn = await pool.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'is_blocked'
      ) AS exists;
    `);

    if (blockedColumn.rows[0].exists) {
      const users = await pool.query(`
        SELECT id, name, email, role, is_blocked
        FROM users
        ORDER BY id;
      `);

      console.log('\n=== USUARIOS Y PERMISOS ===');
      console.table(users.rows);
    } else {
      console.log(
        '\nATENCIÓN: falta la columna is_blocked en users.'
      );
    }

  } catch (error) {
    console.error(
      'Error al consultar PostgreSQL:',
      error.message
    );
  } finally {
    await pool.end();
  }
}

checkDatabase();