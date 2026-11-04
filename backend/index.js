
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');


require('dotenv').config({
  path: path.join(__dirname, '.env')
});

if (process.env.NODE_ENV !== 'production') {
  console.log('Configuración Google OAuth:', {
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    JWT_SECRET: !!process.env.JWT_SECRET,
    FRONTEND_URL: !!process.env.FRONTEND_URL
  });
}


const productRoutes = require('./routes/Products');
const categoryRoutes = require('./routes/Categories');

const authRoutes = require('./routes/auth');
const googleAuthRoutes = require('./routes/googleAuth');

const orderRoutes = require('./routes/orders');

const adminRoutes = require('./routes/admin');

const passwordResetRoutes = require('./routes/passwordReset');


const app = express();
const port = process.env.PORT || 3000;

app.disable('x-powered-by');

app.use(cors());

app.use(express.json({
  limit: '10kb'
}));

app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

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

app.use('/api/products', productRoutes);


app.use('/api/categories', categoryRoutes);


app.use('/api/auth/google', googleAuthRoutes);

app.use('/api/auth', authRoutes);

app.use('/api/auth', passwordResetRoutes);

app.use('/api/orders', orderRoutes);

app.use('/api/admin', adminRoutes);


app.use((req, res) => {
  return res.status(404).json({
    error: 'Ruta no encontrada'
  });
});

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
