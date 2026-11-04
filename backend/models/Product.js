const db = require('../config/db');

const toNum = (v) => v === null || v === undefined ? null : Number(v);

const mapProduct = (row) => {
  if (!row) return row;
  return {
    ...row,
    price: toNum(row.price),
    original_price: toNum(row.original_price),
    stock: toNum(row.stock),
    images: row.images || [], 
    is_new: row.is_new 
  };
};

const FIELDS = `
  id, name, category, description,
  price, original_price, stock, images, 
  brand, brand_url, is_new, created_at
`;

const Product = {
  getAll: async () => {
    const { rows } = await db.query(
      `SELECT ${FIELDS} FROM products ORDER BY created_at DESC, id DESC`
    );
    return rows.map(mapProduct);
  },

  getById: async (id) => {
    const { rows } = await db.query(
      `SELECT ${FIELDS} FROM products WHERE id = $1`,
      [id]
    );
    return mapProduct(rows[0]);
  },

  getByCategory: async (category) => {
    const { rows } = await db.query(
      `SELECT ${FIELDS} FROM products WHERE category = $1 ORDER BY created_at DESC, id DESC`,
      [category]
    );
    return rows.map(mapProduct);
  },

  create: async (data) => {
    const {
      name, category = null, description = null,
      price, original_price = null, stock = 0, images = [],
      brand = null, brand_url = null, is_new = true // Recibimos is_new
    } = data;

    const { rows } = await db.query(
      `INSERT INTO products
         (name, category, description, price, original_price, stock, images, brand, brand_url, is_new)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING ${FIELDS}`,
      [name, category, description, price, original_price, stock, images, brand, brand_url, is_new]
    );
    return mapProduct(rows[0]);
  },

  update: async (id, data) => {
    const {
      name, category = null, description = null,
      price, original_price = null, stock = 0, images = [],
      brand = null, brand_url = null, is_new = false // Recibimos is_new (por defecto false si no viene)
    } = data;

    const { rows } = await db.query(
      `UPDATE products
          SET name = $1, category = $2, description = $3,
              price = $4, original_price = $5, stock = $6, images = $7,
              brand = $8, brand_url = $9, is_new = $10
        WHERE id = $11
        RETURNING ${FIELDS}`,
      [name, category, description, price, original_price, stock, images, brand, brand_url, is_new, id]
    );
    return mapProduct(rows[0]);
  },

  remove: async (id) => {
    const { rowCount } = await db.query(
      'DELETE FROM products WHERE id = $1',
      [id]
    );
    return rowCount > 0;
  },
};

module.exports = Product;