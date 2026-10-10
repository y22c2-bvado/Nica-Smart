// backend/eliminar-usuario.js
require('dotenv').config();
const db = require('./config/db');

// ==========================================
// CONFIGURACIÓN
// ==========================================

const emailAEliminar = 'adminuser123@gmail.com'; // 👈 El usuario a eliminar

// ==========================================

const eliminar = async () => {
  try {
    console.log(`🔍 Buscando usuario: ${emailAEliminar}...`);

    // 1. Primero verificamos que el usuario existe
    const { rows: usuarios } = await db.query(
      'SELECT id, name, email, role FROM users WHERE LOWER(email) = LOWER($1)',
      [emailAEliminar]
    );

    if (usuarios.length === 0) {
      console.log('❌ No se encontró el usuario.');
      return;
    }

    const user = usuarios[0];
    console.log('\n📋 Usuario a eliminar:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Nombre: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rol: ${user.role}`);

    // 2. Eliminamos el usuario
    console.log('\n🗑️  Eliminando usuario...');
    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, email',
      [user.id]
    );

    if (result.rows.length > 0) {
      console.log('\n✅ Usuario eliminado exitosamente:');
      console.table(result.rows);
    } else {
      console.log('⚠️  No se eliminó ningún registro.');
    }

    // 3. Verificamos qué usuarios quedan
    console.log('\n📋 Usuarios restantes en la base de datos:');
    const { rows: restantes } = await db.query(
      `
      SELECT id, name, email, role
      FROM users
      ORDER BY id
      `
    );
    console.table(restantes);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.end();
  }
};

eliminar();