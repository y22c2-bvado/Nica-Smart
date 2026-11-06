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

// ==========================================
// 1. CONFIGURACIÓN DE CORS
// ==========================================
const corsOptions = {
  origin: [
    'http://localhost:5173', // Desarrollo local con Vite
    'http://localhost:3000', // Desarrollo local alternativo
    'https://nica-smart-6z1r.onrender.com' // Tu Frontend en producción
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Manejo de peticiones preflight (OPTIONS)

// ==========================================
// 2. PARSEADOR DE JSON
// ==========================================
app.use(express.json({
  limit: '10kb'
}));

// ==========================================
// 3. CONEXIÓN A BASE DE DATOS
// ==========================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Necesario si usas la URL externa de Render
  }
});

// ==========================================
// 4. RUTA RAÍZ (Para verificar que el backend está vivo)
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
// 5. RUTAS DE LA API
// ==========================================
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth/google', googleAuthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth', passwordResetRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// ==========================================
// 6. ARCHIVOS ESTÁTICOS E IMÁGENES
// ==========================================
// Al servir la carpeta 'public', Express automáticamente servirá 
// las imágenes guardadas en 'public/uploads/'.
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 7. MANEJO DE ERRORES (404 y 500)
// ==========================================
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

// ==========================================
// 8. INICIAR SERVIDOR
// ==========================================
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});