
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();
const pool = require('../config/db');

// ==========================================
// CONFIGURACIÓN DE SEGURIDAD
// ==========================================

const JWT_ISSUER = 'nica-smart';
const JWT_AUDIENCE = 'nica-smart-web';

// ==========================================
// GENERAR TOKEN JWT
// ==========================================

const generateToken = (user, rememberMe = false) => {
  const JWT_SECRET = process.env.JWT_SECRET;

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
      expiresIn: rememberMe ? '7d' : '2h',
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
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
    // VALIDAR TIPOS
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

    // ==========================================
    // VALIDAR NOMBRE
    // ==========================================

    if (cleanName.length < 2 || cleanName.length > 80) {
      return res.status(400).json({
        message: 'El nombre debe tener entre 2 y 80 caracteres.'
      });
    }

    if (/[\x00-\x1F\x7F]/.test(cleanName)) {
      return res.status(400).json({
        message: 'El nombre contiene caracteres no permitidos.'
      });
    }

    // ==========================================
    // VALIDAR CORREO
    // ==========================================

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      cleanEmail.length > 254 ||
      !emailRegex.test(cleanEmail)
    ) {
      return res.status(400).json({
        message: 'Ingresa un correo electrónico válido.'
      });
    }

    // ==========================================
    // VALIDAR CONTRASEÑA
    // ==========================================

    if (
      password.length < 8 ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      return res.status(400).json({
        message:
          'La contraseña debe tener al menos 8 caracteres y no superar 72 bytes.'
      });
    }

    // ==========================================
    // VERIFICAR JWT
    // ==========================================

    if (!process.env.JWT_SECRET) {
      return res.status(503).json({
        message: 'Servicio de autenticación no disponible.'
      });
    }

    // ==========================================
    // VERIFICAR CORREO EXISTENTE
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
        message:
          'Ya existe una cuenta con este correo electrónico.'
      });
    }

    // ==========================================
    // CIFRAR CONTRASEÑA
    // ==========================================

    const hashedPassword = await bcrypt.hash(password, 12);

    // ==========================================
    // CREAR USUARIO NORMAL
    // ==========================================

    // El registro público nunca permite crear
    // administradores ni elegir el rol.

    const result = await pool.query(
      `
      INSERT INTO users (
        name,
        email,
        password,
        role
      )
      VALUES ($1, $2, $3, 'USER')
      RETURNING id, name, email, role
      `,
      [
        cleanName,
        cleanEmail,
        hashedPassword
      ]
    );

    const user = result.rows[0];

    // ==========================================
    // GENERAR SESIÓN
    // ==========================================

    const token = generateToken(user);

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
    if (error.code === '23505') {
      return res.status(409).json({
        message:
          'Ya existe una cuenta con este correo electrónico.'
      });
    }

    console.error('Error registrando usuario:', error);

    return res.status(500).json({
      message: 'No se pudo crear la cuenta.'
    });
  }
});

// ==========================================
// INICIAR SESIÓN
// POST /api/auth/login
// ==========================================

router.post('/login', async (req, res) => {
  try {
    const {
      identifier,
      email,
      password,
      rememberMe = false
    } = req.body || {};

    // ==========================================
    // ACEPTAR CORREO O USUARIO
    // ==========================================

    // Se conserva "email" para compatibilidad
    // con versiones anteriores de Login.jsx.

    const loginIdentifier =
      typeof identifier === 'string'
        ? identifier.trim()
        : typeof email === 'string'
          ? email.trim()
          : '';

    // ==========================================
    // VALIDAR DATOS
    // ==========================================

    if (
      !loginIdentifier ||
      loginIdentifier.length > 254 ||
      /[\x00-\x1F\x7F]/.test(loginIdentifier) ||
      typeof password !== 'string' ||
      !password ||
      password.length > 128
    ) {
      return res.status(400).json({
        message:
          'Ingresa un correo o usuario y una contraseña válidos.'
      });
    }

    if (typeof rememberMe !== 'boolean') {
      return res.status(400).json({
        message: 'La opción Recordarme no es válida.'
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(503).json({
        message: 'Servicio de autenticación no disponible.'
      });
    }
    console.log('🔍 BACKEND - Recibido:', {
      loginIdentifier,
      password: password,
      passwordLength: password.length,
      passwordChars: [...password].map(c => c.charCodeAt(0))
    })
    // ==========================================
    // BUSCAR USUARIO EN POSTGRESQL
    // ==========================================

    // Clientes:
    //   Inician sesión utilizando su correo.
    //
    // Administradores:
    //   Pueden utilizar correo o username.
    //
    // El username solamente se acepta
    // si la cuenta tiene rol ADMIN.

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
         OR (
           UPPER(role) = 'ADMIN'
         )
      LIMIT 1
      `,
      [loginIdentifier]
    );

    // ==========================================
    // CUENTA NO ENCONTRADA
    // ==========================================

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'Usuario o contraseña incorrectos.'
      });
    }

    const user = result.rows[0];

    // ==========================================
    // VERIFICAR CONTRASEÑA CON BCRYPT
    // ==========================================

    
 // 👇 AGREGA ESTO
console.log('🔍 BACKEND - Diagnóstico completo:');
console.log('   - DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'));
console.log('   - Hash que se está usando:', user.password);
console.log('   - Longitud del hash:', user.password?.length);
console.log('   - Email del usuario:', user.email);
console.log('   - ID del usuario:', user.id);
console.log('   - Contraseña enviada:', password);
console.log('   - Contraseña (chars):', [...password].map(c => c.charCodeAt(0)));

const validPassword = await bcrypt.compare(password, user.password);
console.log('   - ¿Coincide?:', validPassword);

    console.log('   ¿Coincide?:', validPassword)

    if (!validPassword) {
      return res.status(401).json({
        message: 'Usuario o contraseña incorrectos.'
      });
    }

    // ==========================================
    // VERIFICAR CUENTA BLOQUEADA
    // ==========================================


    // ==========================================
    // GENERAR TOKEN JWT
    // ==========================================

    const token = generateToken(user, rememberMe);

    // ==========================================
    // RESPUESTA DEL SERVIDOR
    // ==========================================

    return res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      token,
      rememberMe,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username || null,
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
