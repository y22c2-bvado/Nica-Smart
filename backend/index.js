
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

// ==========================================
// IMPORTACIÓN DE RUTAS
// ==========================================

const orderRoutes = require('./routes/orders');
const productRoutes = require('./routes/Products');
const categoryRoutes = require('./routes/Categories');
const authRoutes = require('./routes/auth');

// NUEVA RUTA: AUTENTICACIÓN CON GOOGLE
const googleAuthRoutes = require('./routes/googleAuth');

const app = express();
const port = process.env.PORT || 3000;

// ==========================================
// CONFIGURACIÓN DE SEGURIDAD
// ==========================================

// Permitir solicitudes del frontend
app.use(cors());

// Limitar el tamaño de los JSON recibidos
app.use(express.json({
  limit: '10kb'
}));

// Evitar exponer información sobre Express
app.disable('x-powered-by');

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
// ==========================================

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');

    res.json({
      message: 'Backend Nica-Smart funcionando 🚀',
      db_time: result.rows[0].now
    });

  } catch (err) {
    console.error('Error de PostgreSQL:', err);

    res.status(500).json({
      error: 'Error conectando a la base de datos'
    });
  }
});

// ==========================================
// RUTAS DE PRODUCTOS
// ==========================================

app.use('/api/products', productRoutes);

// ==========================================
// RUTAS DE CATEGORÍAS
// ==========================================

app.use('/api/categories', categoryRoutes);

// ==========================================
// AUTENTICACIÓN CON GOOGLE
// ==========================================

// Recibe el código OAuth enviado desde Login.jsx
// POST http://localhost:3000/api/auth/google

app.use('/api/auth/google', googleAuthRoutes);

// ==========================================
// AUTENTICACIÓN TRADICIONAL
// ==========================================

// Login y registro con correo y contraseña
app.use('/api/auth', authRoutes);

// ==========================================
// RUTAS DE PEDIDOS
// ==========================================

app.use('/api/orders', orderRoutes);

// ==========================================
// RUTAS NO ENCONTRADAS
// ==========================================

app.use((req, res) => {
  res.status(404).json({
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

  res.status(500).json({
    error: 'Error interno del servidor'
  });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
  console.log(`Google OAuth: POST /api/auth/google`);
});
