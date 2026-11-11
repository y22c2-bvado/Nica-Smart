
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const router = express.Router();
const pool = require('../config/db');

// ==========================================
// NICA S-MART - AUTENTICACIÓN
// ==========================================

const JWT_ISSUER = 'nica-smart';
const JWT_AUDIENCE = 'nica-smart-web';

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

const FACEBOOK_API_VERSION =
  process.env.FACEBOOK_API_VERSION || 'v24.0';

// ==========================================
// GENERAR TOKEN JWT
// ==========================================

const generateToken = (
  user,
  rememberMe = false,
  provider = 'local'
) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está configurado.');
  }

  return jwt.sign(
    {
      sub: String(user.id),
      id: user.id,
      provider,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: rememberMe ? '7d' : '2h',
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithm: 'HS256'
    }
  );
};

// ==========================================
// FORMATO DE RESPUESTA
// ==========================================

const authResponse = (
  user,
  provider = 'local',
  rememberMe = false
) => ({
  token: generateToken(user, rememberMe, provider),
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    provider
  }
});

// ==========================================
// VERIFICAR TOKEN DE FACEBOOK
// ==========================================

async function verifyFacebookToken(accessToken) {
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    throw new Error('FACEBOOK_NOT_CONFIGURED');
  }

  const baseURL =
    `https://graph.facebook.com/${FACEBOOK_API_VERSION}`;

  // Verificar que el token pertenezca a
  // nuestra aplicación de Meta.

  const debugURL = new URL(`${baseURL}/debug_token`);

  debugURL.searchParams.set(
    'input_token',
    accessToken
  );

  debugURL.searchParams.set(
    'access_token',
    `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`
  );

  const debugResponse = await fetch(debugURL);
  const debugResult = await debugResponse.json();

  const tokenInfo = debugResult.data;

  if (
    !debugResponse.ok ||
    !tokenInfo?.is_valid ||
    String(tokenInfo.app_id) !== String(FACEBOOK_APP_ID) ||
    tokenInfo.type !== 'USER' ||
    !tokenInfo.user_id
  ) {
    throw new Error('INVALID_FACEBOOK_TOKEN');
  }

  // Consultar el perfil directamente con Meta

  const proof = crypto
    .createHmac('sha256', FACEBOOK_APP_SECRET)
    .update(accessToken)
    .digest('hex');

  const profileURL = new URL(`${baseURL}/me`);

  profileURL.searchParams.set(
    'fields',
    'id,name,email'
  );

  profileURL.searchParams.set(
    'access_token',
    accessToken
  );

  profileURL.searchParams.set(
    'appsecret_proof',
    proof
  );

  const profileResponse = await fetch(profileURL);
  const profile = await profileResponse.json();

  if (
    !profileResponse.ok ||
    !profile.id ||
    String(profile.id) !== String(tokenInfo.user_id)
  ) {
    throw new Error('INVALID_FACEBOOK_TOKEN');
  }

  return profile;
}

// ==========================================
// REGISTRAR CLIENTE
// POST /api/auth/register
// ==========================================

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

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

    // Validar nombre
    if (
      cleanName.length < 2 ||
      cleanName.length > 80 ||
      /[\x00-\x1F\x7F]/.test(cleanName)
    ) {
      return res.status(400).json({
        message: 'Nombre inválido.'
      });
    }

    // Validar correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      cleanEmail.length > 254 ||
      !emailRegex.test(cleanEmail)
    ) {
      return res.status(400).json({
        message: 'Ingresa un correo electrónico válido.'
      });
    }

    // Validar contraseña
    if (
      password.length < 8 ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      return res.status(400).json({
        message:
          'La contraseña debe tener al menos 8 caracteres y no superar 72 bytes.'
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(503).json({
        message: 'Servicio de autenticación no disponible.'
      });
    }

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

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

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
      [cleanName, cleanEmail, hashedPassword]
    );

    const user = result.rows[0];

    return res.status(201).json({
      message: 'Cuenta creada exitosamente.',
      ...authResponse(user, 'local')
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
// INICIAR SESIÓN TRADICIONAL
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

    const loginIdentifier =
      typeof identifier === 'string'
        ? identifier.trim()
        : typeof email === 'string'
          ? email.trim()
          : '';

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
          'Ingresa un correo y contraseña válidos.'
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

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        password,
        role,
        is_blocked
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [loginIdentifier]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'Usuario o contraseña incorrectos.'
      });
    }

    const user = result.rows[0];

    if (!user.password) {
      return res.status(401).json({
        message: 'Usuario o contraseña incorrectos.'
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        message: 'Usuario o contraseña incorrectos.'
      });
    }

    if (user.is_blocked) {
      return res.status(403).json({
        message:
          'Esta cuenta está bloqueada o no está disponible.'
      });
    }

    return res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      rememberMe,
      ...authResponse(user, 'local', rememberMe)
    });

  } catch (error) {
    console.error('Error en login:', error);

    return res.status(500).json({
      message: 'Error al iniciar sesión.'
    });
  }
});

// ==========================================
// INICIAR SESIÓN CON FACEBOOK
// POST /api/auth/facebook
// ==========================================

router.post('/facebook', async (req, res) => {
  const { accessToken } = req.body || {};

  if (
    typeof accessToken !== 'string' ||
    !accessToken.trim() ||
    accessToken.length > 4096
  ) {
    return res.status(400).json({
      message: 'Token de Facebook obligatorio.'
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(503).json({
      message: 'Servicio de autenticación no disponible.'
    });
  }

  let client;
  let inTransaction = false;

  try {
    // ======================================
    // 1. VERIFICAR FACEBOOK
    // ======================================

    const profile = await verifyFacebookToken(
      accessToken
    );

    const facebookId = String(profile.id);

    const name = String(
      profile.name || 'Usuario Facebook'
    ).trim().slice(0, 80);

    const email = profile.email
      ? String(profile.email).trim().toLowerCase()
      : null;

    // ======================================
    // 2. BUSCAR IDENTIDAD EXISTENTE
    // ======================================

    client = await pool.connect();

    // Evita crear duplicados en solicitudes
    // simultáneas del mismo usuario Facebook.
    await client.query('BEGIN');
    inTransaction = true;

    await client.query(
      'SELECT pg_advisory_xact_lock(hashtext($1))',
      [`facebook:${facebookId}`]
    );

    const existing = await client.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.is_blocked
      FROM social_accounts s
      INNER JOIN users u ON u.id = s.user_id
      WHERE s.provider = 'facebook'
        AND s.provider_user_id = $1
      LIMIT 1
      `,
      [facebookId]
    );

    if (existing.rows.length > 0) {
      const user = existing.rows[0];

      if (user.is_blocked) {
        await client.query('ROLLBACK');
        inTransaction = false;

        return res.status(403).json({
          message: 'Esta cuenta está bloqueada.'
        });
      }

      await client.query('COMMIT');
      inTransaction = false;

      return res.status(200).json({
        message:
          'Inicio de sesión con Facebook exitoso.',
        ...authResponse(user, 'facebook')
      });
    }

    // ======================================
    // 3. VERIFICAR CORREO
    // ======================================

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254
    ) {
      await client.query('ROLLBACK');
      inTransaction = false;

      return res.status(422).json({
        message:
          'Facebook no proporcionó un correo válido. ' +
          'Revisá el correo de tu cuenta y autorizá ' +
          'el permiso email.'
      });
    }

    // ======================================
    // 4. EVITAR VINCULACIÓN INSEGURA
    // ======================================

    const sameEmail = await client.query(
      `
      SELECT id
      FROM users
      WHERE LOWER(email) = $1
      LIMIT 1
      `,
      [email]
    );

    if (sameEmail.rows.length > 0) {
      await client.query('ROLLBACK');
      inTransaction = false;

      return res.status(409).json({
        code: 'ACCOUNT_ALREADY_EXISTS',
        message:
          'Ya existe una cuenta con este correo. ' +
          'Iniciá sesión con tu método habitual. ' +
          'La vinculación con Facebook debe hacerse ' +
          'desde una sesión autenticada.'
      });
    }

    // ======================================
    // 5. CREAR USUARIO
    // ======================================

    // Contraseña aleatoria para evitar que
    // exista una contraseña local conocida.

    const randomPassword = crypto
      .randomBytes(48)
      .toString('hex');

    const hashedPassword = await bcrypt.hash(
      randomPassword,
      12
    );

    // El rol de un usuario social nuevo
    // siempre será USER.

    const newUserResult = await client.query(
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
      [name, email, hashedPassword]
    );

    const user = newUserResult.rows[0];

    // ======================================
    // 6. VINCULAR CUENTA DE FACEBOOK
    // ======================================

    await client.query(
      `
      INSERT INTO social_accounts (
        user_id,
        provider,
        provider_user_id
      )
      VALUES ($1, 'facebook', $2)
      `,
      [user.id, facebookId]
    );

    await client.query('COMMIT');
    inTransaction = false;

    // ======================================
    // 7. DEVOLVER JWT
    // ======================================

    return res.status(201).json({
      message: 'Cuenta de Facebook creada.',
      ...authResponse(user, 'facebook')
    });

  } catch (error) {
    if (client && inTransaction) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback fallido:', rollbackError);
      }
    }

    if (error.message === 'INVALID_FACEBOOK_TOKEN') {
      return res.status(401).json({
        message:
          'Token de Facebook inválido o expirado.'
      });
    }

    if (error.message === 'FACEBOOK_NOT_CONFIGURED') {
      return res.status(503).json({
        message:
          'Facebook Login no está configurado en Render.'
      });
    }

    if (error.code === '23505') {
      return res.status(409).json({
        message:
          'La cuenta ya existe. Intentá iniciar sesión nuevamente.'
      });
    }

    console.error('Error en Facebook Login:', error);

    return res.status(500).json({
      message:
        'No se pudo iniciar sesión con Facebook.'
    });

  } finally {
    if (client) {
      client.release();
    }
  }
});

module.exports = router;
