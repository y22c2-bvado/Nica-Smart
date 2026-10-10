// backend/verificar-usuario.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./config/db');

const verificar = async () => {
  try {
    const email = 'adminuser123@gmail.com';
    const passwordAProbar = 'vado0904$'; // La misma que pusiste en el reset

    const { rows } = await db.query(
      'SELECT id, name, email, password, role FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (rows.length === 0) {
      console.log('❌ Usuario NO encontrado en la base de datos.');
      return;
    }

    const user = rows[0];
    console.log('📋 Datos del usuario:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rol: ${user.role}`);
    console.log(`   Hash almacenado: ${user.password}`);
    console.log(`   Longitud del hash: ${user.password?.length || 0}`);
    console.log(`   ¿Es hash bcrypt?: ${/^\$2[aby]\$/.test(user.password || '') ? '✅ SÍ' : '❌ NO'}`);

    // Probar la contraseña que estás escribiendo en el login
    const coincide = await bcrypt.compare(passwordAProbar, user.password);
    console.log(`   ¿Coincide la contraseña "${passwordAProbar}"?: ${coincide ? '✅ SÍ' : '❌ NO'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.end();
  }
};

verificar();