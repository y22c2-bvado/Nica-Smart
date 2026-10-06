const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Permite peticiones desde tu frontend
app.use(express.json()); // Permite recibir JSON en el body

// Configurar Pool de conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Requerido por Render para conexiones seguras
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
    console.error(err);
    res.status(500).json({ error: 'Error conectando a la base de datos' });
  }
});

// ==========================================
// RUTAS DE PRODUCTOS
// ==========================================

// Obtener todos los productos
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Obtener productos por categoría (¡debe ir ANTES de /:id!)
app.get('/api/products/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const result = await pool.query(
      'SELECT * FROM products WHERE category = $1 ORDER BY id',
      [category]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al filtrar productos' });
  }
});

// Obtener un producto por ID (¡va AL FINAL!)
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});