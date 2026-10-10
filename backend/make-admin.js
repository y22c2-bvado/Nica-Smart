// backend/make-admin.js
require('dotenv').config(); // Carga las variables del .env
const db = require('./config/db'); // Tu conexión a la base de datos

// 👇 CAMBIA ESTO por el correo del usuario que quieres hacer admin
const emailToPromote = 'adminuser123@gmail.com'; 

const promoteToAdmin = async () => {
  try {
    console.log(`Buscando usuario con email: ${emailToPromote}...`);
    
    const result = await db.query(
      "UPDATE users SET role = 'admin' WHERE email = $1 RETURNING id, name, email, role",
      [emailToPromote]
    );

    if (result.rows.length > 0) {
      console.log('✅ ¡Usuario actualizado a admin exitosamente!');
      console.table(result.rows[0]); // Lo muestra en una tablita bonita
    } else {
      console.log('❌ No se encontró ningún usuario con ese email.');
    }
  } catch (error) {
    console.error('❌ Error al actualizar el rol:', error.message);
  } finally {
    // Cerramos la conexión para que el script termine
    await db.end(); 
  }
};

promoteToAdmin();