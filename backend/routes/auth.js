
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();
const pool = require('../config/db');

// ==========================================
// INICIAR SESIÓN CON CORREO Y CONTRASEÑA
// POST /api/auth/login
// ==========================================

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: 'Correo y contraseña son obligatorios.'
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('Falta configurar JWT_SECRET');

      return res.status(503).json({
        message: 'Servicio de autenticación no disponible.'
      });
    }

    // ==========================================
    // BUSCAR USUARIO EN POSTGRESQL
    // ==========================================

    const result = await pool.query(
      `
      SELECT id, name, email, password, role
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [email.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'Correo o contraseña incorrectos.'
      });
    }

    const user = result.rows[0];

    // ==========================================
    // VALIDAR CONTRASEÑA CIFRADA
    // ==========================================

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        message: 'Correo o contraseña incorrectos.'
      });
    }

    // ==========================================
    // GENERAR JWT
    // ==========================================

    const token = jwt.sign(
      {
        sub: String(user.id),
        provider: 'local',
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '2h',
        issuer: 'nica-smart',
        audience: 'nica-smart-web'
      }
    );

    // ==========================================
    // RESPONDER AL FRONTEND
    // ==========================================

    return res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        provider: 'local'
      }
    });

  } catch (error) {
    console.error('Error en login:', error);

    return res.status(500).json({
      message: 'Error al iniciar sesión.'
    });
  }
});

module.exports = router;
