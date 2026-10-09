
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();
const pool = require('../config/db');

// ==========================================
// CONFIGURACIÓN DE SEGURIDAD
// ==========================================

const JWT_SECRET = process.env.JWT_SECRET;

// ==========================================
// GENERAR TOKEN JWT
// ==========================================

const generateToken = (user) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET no está configurado.');
  }

  return jwt.sign(
    {
      sub: String(user.id),
      provider: 'local',
      role: user.role
    },
    JWT_SECRET,
    {
      expiresIn: '2h',
      issuer: 'nica-smart',
      audience: 'nica-smart-web',
      algorithm: 'HS256'
    }
  );
};

// ==========================================
// REGISTRAR CLIENTE
// POST /api/auth/register
// ==========================================

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    // ==========================================
    // VALIDAR DATOS
    // ==========================================

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        message: 'Completa todos los campos obligatorios.'
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
      cleanName.length < 2 ||
      cleanName.length > 80
    ) {
      return res.status(400).json({
        message: 'El nombre debe tener entre 2 y 80 caracteres.'
      });
    }

    if (/[\x00-\x1F\x7F]/.test(cleanName)) {
      return res.status(400).json({
        message: 'El nombre contiene caracteres no permitidos.'
      });
    }

    // Acepta correos de diferentes proveedores
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      cleanEmail.length > 254 ||
      !emailRegex.test(cleanEmail)
    ) {
      return res.status(400).json({
        message: 'Ingresa un correo electrónico válido.'
      });
    }

    if (
      password.length < 8 ||
      password.length > 72
    ) {
      return res.status(400).json({
        message: 'La contraseña debe tener entre 8 y 72 caracteres.'
      });
    }

    // ==========================================
    // VERIFICAR CONFIGURACIÓN JWT
    // ==========================================

    if (!JWT_SECRET) {
      console.error('Falta configurar JWT_SECRET');

      return res.status(503).json({
        message: 'Servicio de autenticación no disponible.'
      });
    }

    // ==========================================
    // VERIFICAR SI YA EXISTE EL CORREO
    // ==========================================

    const existingUser = await pool.query(
      `
      SELECT id
      FROM users
      WHERE LOWER(email) = $1
      LIMIT 1
      `,
      [cleanEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: 'Ya existe una cuenta con este correo electrónico.'
      });
    }

    // ==========================================
    // CIFRAR CONTRASEÑA
    // ==========================================

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    // ==========================================
    // REGISTRAR USUARIO EN POSTGRESQL
    // ==========================================

    const result = await pool.query(
      `
      INSERT INTO users (
        name,
        email,
        password,
        role
      )
      VALUES ($1, $2, $3, $4)

      RETURNING id, name, email, role
      `,
      [
        cleanName,
        cleanEmail,
        hashedPassword,
        'USER'
      ]
    );

    const user = result.rows[0];

    // ==========================================
    // GENERAR SESIÓN AUTOMÁTICAMENTE
    // ==========================================

    const token = generateToken(user);

    // ==========================================
    // RESPONDER AL FRONTEND
    // ==========================================

    return res.status(201).json({
      message: 'Cuenta creada exitosamente.',
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
    // Correo duplicado en PostgreSQL
    if (error.code === '23505') {
      return res.status(409).json({
        message: 'Ya existe una cuenta con este correo electrónico.'
      });
    }

    console.error('Error registrando usuario:', error);

    return res.status(500).json({
      message: 'No se pudo crear la cuenta.'
    });
  }
});

// ==========================================
// INICIAR SESIÓN CON CORREO Y CONTRASEÑA
// POST /api/auth/login
// ==========================================

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // ==========================================
    // VALIDAR DATOS RECIBIDOS
    // ==========================================

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

    if (!JWT_SECRET) {
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
      SELECT
        id,
        name,
        email,
        password,
        role
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
    // GENERAR TOKEN JWT
    // ==========================================

    const token = generateToken(user);

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
