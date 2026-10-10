// backend/resetear-admin-principal.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./config/db');

// ==========================================
// CONFIGURACIÓN
// ==========================================

const emailUsuario = 'admin@nica-smart.com'; // 👈 El admin principal
const nuevaPassword = 'Admin2026$';           // 👈 Contraseña nueva (cámbiala si quieres)

// ==========================================

const resetear = async () => {
  try {
    console.log(`🔍 Buscando usuario: ${emailUsuario}...`);

    // 1. Verificamos que el usuario existe
    const { rows: usuarios } = await db.query(
      'SELECT id, name, email, role FROM users WHERE LOWER(email) = LOWER($1)',
      [emailUsuario]
    );

    if (usuarios.length === 0) {
      console.log('❌ No se encontró el usuario.');
      return;
    }

    const user = usuarios[0];
    console.log('📋 Usuario encontrado:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Nombre: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rol: ${user.role}`);

    // 2. Generamos el hash de la nueva contraseña
    console.log('\n🔐 Generando hash seguro...');
    const hashedPassword = await bcrypt.hash(nuevaPassword, 12);

    // 3. Actualizamos la contraseña en la BD
    await db.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, user.id]
    );

    console.log('\n✅ Contraseña actualizada exitosamente.');
    console.log(`\n📧 Usuario: ${emailUsuario}`);
    console.log(`🔑 Nueva contraseña: ${nuevaPassword}`);
    console.log('\n⚠️  Guarda esta contraseña en un lugar seguro.');

    // 4. Verificamos que el cambio funcionó
    const { rows: verificacion } = await db.query(
      'SELECT password FROM users WHERE id = $1',
      [user.id]
    );
    const coincide = await bcrypt.compare(nuevaPassword, verificacion[0].password);
    console.log(`\n🧪 Verificación: ${coincide ? '✅ La contraseña funciona' : '❌ Algo falló'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.end();
  }
};

resetear();