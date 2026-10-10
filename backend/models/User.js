const db = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  findByEmail: async (email) => {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0];
  },

  create: async ({ name, email, password, role = 'user' }) => {
    // 🔐 Hashear SIEMPRE antes de guardar
    const hashedPassword = await bcrypt.hash(password, 12);

    const { rows } = await db.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role`,
      [name, email, hashedPassword, role]
    );
    return rows[0];
  }
};

module.exports = User;