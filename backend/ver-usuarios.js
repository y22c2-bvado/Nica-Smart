const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verUsuarios() {
  try {
    const res = await pool.query('SELECT id, name, email, role, is_blocked, created_at FROM users ORDER BY id ASC');
    
    console.log('\n👥 USUARIOS REGISTRADOS:\n');
    console.table(res.rows); // Esto lo imprime en una tabla muy bonita en la consola

    const social = await pool.query('SELECT user_id, provider FROM social_accounts');
    console.log('\n🔗 CUENTAS VINCULADAS (Google/Facebook):\n');
    console.table(social.rows);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

verUsuarios();