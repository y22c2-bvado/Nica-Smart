const db = require('../config/db');

const Category = {
  getAll: async () => {
    const { rows } = await db.query(
      'SELECT DISTINCT category FROM products ORDER BY category'
    );
    return rows;
  },
};

module.exports = Category;