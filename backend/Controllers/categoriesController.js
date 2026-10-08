const Category = require('../models/Category');

const categoriesController = {
  getAll: async (req, res) => {
    try {
      const categories = await Category.getAll();
      res.json(categories);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = categoriesController;