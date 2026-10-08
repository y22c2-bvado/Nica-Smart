const Product = require('../models/Product');

const productController = {
  getAll: async (req, res) => {
    try {
      const products = await Product.getAll();
      res.json(products);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const product = await Product.getById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      res.json(product);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },

  getByCategory: async (req, res) => {
    try {
      const products = await Product.getByCategory(req.params.category);
      res.json(products);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = productController;