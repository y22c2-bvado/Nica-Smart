// backend/migrar-passwords.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./config/db');

const migrarPasswords = async () => {
  try {
    console.log('🔍 Buscando usuarios en la base de datos...');

    // 1. Traemos todos los usuarios
    const { rows: usuarios } = await db.query(
      'SELECT id, email, password FROM users'
    );

    if (usuarios.length === 0) {
      console.log('⚠️  No hay usuarios en la base de datos.');
      return;
    }

    console.log(`📋 Encontrados ${usuarios.length} usuarios.`);

    let actualizados = 0;
    let omitidos = 0;

    // 2. Recorremos cada usuario
    for (const user of usuarios) {
      // Detectamos si la contraseña YA está hasheada con bcrypt.
      // Los hashes de bcrypt siempre empiezan con "$2a$", "$2b$" o "$2y$"
      const yaEstaHasheada = /^\$2[aby]\$/.test(user.password || '');

      if (yaEstaHasheada) {
        console.log(`⏭️  Omitido (ya está hasheado): ${user.email}`);
        omitidos++;
        continue;
      }

      // 3. Hasheamos la contraseña en texto plano
      const nuevoHash = await bcrypt.hash(user.password, 12);

      // 4. Actualizamos el usuario en la base de datos
      await db.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [nuevoHash, user.id]
      );

      console.log(`✅ Actualizado: ${user.email}`);
      actualizados++;
    }

    console.log('\n📊 Resumen:');
    console.log(`   - Contraseñas actualizadas: ${actualizados}`);
    console.log(`   - Usuarios omitidos (ya hasheados): ${omitidos}`);
    console.log('🎉 Migración completada.');

  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
  } finally {
    // Cerramos la conexión para que el script termine
    await db.end();
  }
};

migrarPasswords();