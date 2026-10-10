
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

// ==========================================
// CONFIGURACIÓN DE VARIABLES DE ENTORNO
// ==========================================

require('dotenv').config({
  path: path.join(__dirname, '.env')
});

// ==========================================
// DIAGNÓSTICO DE GOOGLE OAUTH
// ==========================================

if (process.env.NODE_ENV !== 'production') {
  console.log('Configuración Google OAuth:', {
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    JWT_SECRET: !!process.env.JWT_SECRET,
    FRONTEND_URL: !!process.env.FRONTEND_URL
  });
}

// ==========================================
// IMPORTACIÓN DE RUTAS
// ==========================================

const productRoutes = require('./routes/Products');
const categoryRoutes = require('./routes/Categories');

const authRoutes = require('./routes/auth');
const googleAuthRoutes = require('./routes/googleAuth');

const orderRoutes = require('./routes/orders');

// NUEVO: PANEL DE ADMINISTRACIÓN
const adminRoutes = require('./routes/admin');

// NUEVO: RECUPERACIÓN DE CONTRASEÑA
const passwordResetRoutes = require('./routes/passwordReset');

// ==========================================
// INICIALIZAR EXPRESS
// ==========================================

const app = express();
const port = process.env.PORT || 3000;

// ==========================================
// CONFIGURACIÓN DE SEGURIDAD
// ==========================================

app.disable('x-powered-by');

// Permitir solicitudes del frontend.
// Más adelante restringiremos los orígenes
// al dominio de NICA S-MART.
app.use(cors());

app.use(express.json({
  limit: '10kb'
}));

// ==========================================
// CONEXIÓN A POSTGRESQL
// ==========================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// ==========================================
// RUTA DE PRUEBA
// GET /
// ==========================================

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');

    return res.json({
      message: 'Backend Nica-Smart funcionando 🚀',
      db_time: result.rows[0].now
    });

  } catch (error) {
    console.error('Error de PostgreSQL:', error);

    return res.status(500).json({
      error: 'Error conectando a la base de datos'
    });
  }
});

// ==========================================
// RUTAS PÚBLICAS DE PRODUCTOS
// ==========================================

app.use('/api/products', productRoutes);

// ==========================================
// RUTAS DE CATEGORÍAS
// ==========================================

app.use('/api/categories', categoryRoutes);

// ==========================================
// AUTENTICACIÓN CON GOOGLE
// ==========================================

app.use('/api/auth/google', googleAuthRoutes);

// ==========================================
// REGISTRO Y LOGIN CON CORREO
// ==========================================

app.use('/api/auth', authRoutes);

// ==========================================
// RECUPERACIÓN DE CONTRASEÑAS
// ==========================================

app.use('/api/auth', passwordResetRoutes);

// ==========================================
// PEDIDOS DE CLIENTES
// ==========================================

app.use('/api/orders', orderRoutes);

// ==========================================
// ADMINISTRACIÓN
// ==========================================

// Todas las rutas deben estar protegidas
// por requireAdmin dentro de admin.js.

app.use('/api/admin', adminRoutes);

// ==========================================
// RUTAS NO ENCONTRADAS
// ==========================================

app.use((req, res) => {
  return res.status(404).json({
    error: 'Ruta no encontrada'
  });
});

// ==========================================
// MANEJO GENERAL DE ERRORES
// ==========================================

app.use((err, req, res, next) => {
  console.error('Error del servidor:', err);

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'La solicitud supera el tamaño permitido'
    });
  }

  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({
      error: 'Formato JSON inválido'
    });
  }

  return res.status(500).json({
    error: 'Error interno del servidor'
  });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);

  console.log('Rutas disponibles:');
  console.log('Productos: /api/products');
  console.log('Categorías: /api/categories');
  console.log('Login: /api/auth/login');
  console.log('Registro: /api/auth/register');
  console.log('Google: /api/auth/google');
  console.log('Recuperación: /api/auth/forgot-password');
  console.log('Pedidos: /api/orders');
  console.log('Administración: /api/admin');
});
