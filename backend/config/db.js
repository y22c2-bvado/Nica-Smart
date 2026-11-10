
const { Pool } = require('pg');
const path = require('path');

// ==========================================
// NICA S-MART - POSTGRESQL
// ==========================================

// Cargar variables de entorno
require('dotenv').config({
  path: path.join(__dirname, '..', '.env')
});

// ==========================================
// VALIDAR CONFIGURACIÓN
// ==========================================

if (!process.env.DATABASE_URL) {
  throw new Error(
    'Falta configurar DATABASE_URL en el backend.'
  );
}

// ==========================================
// DETECTAR BASE DE DATOS LOCAL
// ==========================================

const isLocalDatabase =
  /localhost|127\.0\.0\.1/i.test(
    process.env.DATABASE_URL
  );

// ==========================================
// CONFIGURACIÓN DEL POOL
// ==========================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl: isLocalDatabase
    ? false
    : {
        rejectUnauthorized: false
      },

  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

// ==========================================
// MANEJO DE ERRORES
// ==========================================

pool.on('error', (err) => {
  console.error(
    'Error inesperado en PostgreSQL:',
    err.message
  );
});

// ==========================================
// EXPORTAR CONEXIÓN
// ==========================================

module.exports = pool;
