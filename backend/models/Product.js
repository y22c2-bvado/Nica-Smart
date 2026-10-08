const db = require('../config/db');

const Product = {
  getAll: async () => {
    const { rows } = await db.query('SELECT * FROM products ORDER BY id');
    return rows;
  },

  getById: async (id) => {
    const { rows } = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    return rows[0];
  },

  getByCategory: async (category) => {
    const { rows } = await db.query(
      'SELECT * FROM products WHERE category = $1 ORDER BY id',
      [category]
    );
    return rows;
  },
};

module.exports = Product;