// backend/buscar-duplicados.js
require('dotenv').config();
const db = require('./config/db');

const buscar = async () => {
  try {
    console.log('🔌 Conectado a:', 
      process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@')
    );
    console.log('');

    // 1. Buscar usuarios con el correo problemático
    const { rows } = await db.query(
      `
      SELECT 
        id, 
        name, 
        email, 
        role,
        LENGTH(password) AS hash_length,
        LEFT(password, 20) AS hash_inicio
      FROM users 
      WHERE LOWER(email) = LOWER($1)
      ORDER BY id
      `,
      ['adminuser123@gmail.com']
    );

    console.log(`📋 Usuarios con ese correo: ${rows.length}`);
    if (rows.length > 0) {
      console.table(rows);
    }

    // 2. También ver TODOS los usuarios de la BD para tener una vista general
    console.log('\n📋 TODOS los usuarios en la base de datos:');
    const { rows: todos } = await db.query(
      `
      SELECT 
        id, 
        name, 
        email, 
        role,
        LENGTH(password) AS hash_length
      FROM users
      ORDER BY id
      `
    );
    console.table(todos);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.end();
  }
};

buscar();