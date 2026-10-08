const db = require('../config/db');

const User = {
  findByEmail: async (email) => {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0];
  },

  create: async ({ name, email, password, role = 'user' }) => {
    const { rows } = await db.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, role`,
      [name, email, password, role]
    );
    return rows[0];
  },
};

module.exports = User;