const User = require('../models/User');
const jwt = require('jsonwebtoken'); // Asegúrate de tener instalado jsonwebtoken

const authController = {
  login: async (req, res) => {
    try {
      // 1. Recibimos "identifier" que es lo que envía el frontend
      const { identifier, password, rememberMe } = req.body;

      if (!identifier || !password) {
        return res.status(400).json({ message: 'Faltan datos obligatorios.' });
      }

      // 2. Buscamos al usuario por email
      // NOTA: Si permites login con username, aquí deberías hacer una lógica extra
      const user = await User.findByEmail(identifier);

      if (!user) {
        return res.status(401).json({ message: 'Credenciales inválidas.' });
      }

      // 3. Verificamos la contraseña
      // ⚠️ IMPORTANTE: Esto compara texto plano. En producción DEBES usar bcrypt.
      if (user.password !== password) {
        return res.status(401).json({ message: 'Credenciales inválidas.' });
      }

      // 4. Generamos el Token JWT
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: rememberMe ? '30d' : '1d' } // Si marcó "Recordarme", dura 30 días
      );

      // 5. Respondemos con la estructura exacta que espera Login.jsx
      res.json({
        token: token, // 👈 ¡El token que faltaba!
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role, // 👈 Aquí va el rol (USER o ADMIN)
          provider: 'local'
        }
      });

    } catch (err) {
      console.error('Error en login:', err);
      res.status(500).json({ message: 'Error interno del servidor.' });
    }
  },
};

module.exports = authController;