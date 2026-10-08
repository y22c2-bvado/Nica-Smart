const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const productRoutes = require('./routes/Products');
const categoryRoutes = require('./routes/Categories');
const authRoutes = require('./routes/auth');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

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

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes);


app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});