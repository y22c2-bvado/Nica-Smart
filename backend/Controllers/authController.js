const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const db = require('../config/db');

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const authController = {

  login: async (req, res) => {
    try {
      const { identifier, password, rememberMe } = req.body;

      if (!identifier || !password) {
        return res.status(400).json({ message: 'Faltan datos obligatorios.' });
      }

      const user = await User.findByEmail(identifier);

      if (!user) {
        return res.status(401).json({ message: 'Credenciales inválidas.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ message: 'Credenciales inválidas.' });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: rememberMe ? '30d' : '1d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          provider: 'local'
        }
      });

    } catch (err) {
      console.error('Error en login:', err);
      res.status(500).json({ message: 'Error interno del servidor.' });
    }
  },

  forgotPassword: async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'El correo es obligatorio.' });
    }

    try {
      const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);

      if (userResult.rows.length === 0) {
        return res.status(200).json({
          message: 'Si el correo está registrado, recibirás un enlace.'
        });
      }

      const user = userResult.rows[0];

      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(resetToken);
      const expiresAt = new Date(Date.now() + 3600000);

      await db.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);
      await db.query(
        'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
        [user.id, tokenHash, expiresAt]
      );

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

      await transporter.sendMail({
        from: `"Nica-Smart" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Recuperación de contraseña - Nica-Smart',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
            <h2 style="color: #6a0dad;">🛒 Nica-Smart</h2>
            <p>Hola <strong>${user.name}</strong>,</p>
            <p>Recibimos una solicitud para restablecer tu contraseña.</p>
            <p>
              <a href="${resetLink}" 
                 style="display:inline-block; padding:12px 24px; background:#6a0dad; color:#fff; text-decoration:none; border-radius:6px;">
                Restablecer Contraseña
              </a>
            </p>
            <p style="font-size: 13px; color: #666;">
              Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este correo.
            </p>
          </div>
        `
      });

      res.status(200).json({ message: 'Correo enviado exitosamente.' });

    } catch (error) {
      console.error('Error en forgotPassword:', error);
      res.status(500).json({ message: 'Error al enviar el correo.' });
    }
  },

  resetPassword: async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Faltan datos.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    try {

      const tokenHash = hashToken(token);

      const resetResult = await db.query(
        'SELECT * FROM password_reset_tokens WHERE token_hash = $1 AND expires_at > NOW()',
        [tokenHash]
      );

      if (resetResult.rows.length === 0) {
        return res.status(400).json({ message: 'Token inválido o expirado.' });
      }

      const resetRequest = resetResult.rows[0];


      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await db.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, resetRequest.user_id]
      );

      await db.query('DELETE FROM password_reset_tokens WHERE id = $1', [resetRequest.id]);

      res.status(200).json({ message: 'Contraseña actualizada correctamente.' });

    } catch (error) {
      console.error('Error en resetPassword:', error);
      res.status(500).json({ message: 'Error en el servidor.' });
    }
  }
};

module.exports = authController;