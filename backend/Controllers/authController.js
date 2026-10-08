const User = require('../models/User');

const authController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findByEmail(email);

      if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = authController;