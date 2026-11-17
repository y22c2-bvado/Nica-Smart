
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

  const appAccessToken =
    `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`;

  // ========================================
  // 1. VERIFICAR TOKEN CON META
  // ========================================

  const debugURL = new URL(
    `${baseURL}/debug_token`
  );

  debugURL.searchParams.set(
    'input_token',
    accessToken
  );

  debugURL.searchParams.set(
    'access_token',
    appAccessToken
  );

  let debugResponse;
  let debugResult;

  try {
    debugResponse = await fetch(debugURL, {
      signal: AbortSignal.timeout(12000)
    });

    debugResult = await debugResponse.json();

  } catch (err) {
    console.error('FACEBOOK_DIAGNOSTICO:', {
      etapa: 'debug_token',
      causa: 'NETWORK_OR_TIMEOUT',
      tipoError: err?.name || 'Error'
    });

    throw new Error('FACEBOOK_META_UNAVAILABLE');
  }

  const tokenInfo = debugResult?.data;

  // ========================================
  // DIAGNÓSTICO SEGURO
  // ========================================

  const diagnostico = {
    etapa: 'debug_token',
    httpStatus: debugResponse.status,
    tokenValido: tokenInfo?.is_valid === true,
    appIdRecibido: tokenInfo?.app_id ?? null,
    appIdConfigurado: FACEBOOK_APP_ID,
    tipoToken: tokenInfo?.type ?? null,
    tieneUserId: Boolean(tokenInfo?.user_id),
    codigoMeta:
      debugResult?.error?.code ??
      tokenInfo?.error?.code ??
      null,
    subcodigoMeta:
      debugResult?.error?.error_subcode ?? null
  };

  // Nunca imprimir el accessToken,
  // App Secret ni las URLs completas.

  if (
    !debugResponse.ok ||
    !tokenInfo?.is_valid
  ) {
    console.warn(
      'FACEBOOK_DIAGNOSTICO:',
      diagnostico
    );

    throw new Error(
      !debugResponse.ok
        ? 'FACEBOOK_META_REJECTED'
        : 'INVALID_FACEBOOK_TOKEN'
    );
  }

  // ========================================
  // COMPROBAR APP ID
  // ========================================

  if (
    String(tokenInfo.app_id) !==
    String(FACEBOOK_APP_ID)
  ) {
    console.warn('FACEBOOK_DIAGNOSTICO:', {
      ...diagnostico,
      causa: 'APP_ID_MISMATCH'
    });

    throw new Error('FACEBOOK_APP_MISMATCH');
  }

  // ========================================
  // COMPROBAR TIPO DE TOKEN
  // ========================================

  if (
    tokenInfo.type !== 'USER' ||
    !tokenInfo.user_id
  ) {
    console.warn('FACEBOOK_DIAGNOSTICO:', {
      ...diagnostico,
      causa: 'NOT_USER_TOKEN'
    });

    throw new Error('INVALID_FACEBOOK_TOKEN');
  }

  // ========================================
  // 2. OBTENER PERFIL DE FACEBOOK
  // ========================================

  const proof = crypto
    .createHmac('sha256', FACEBOOK_APP_SECRET)
    .update(accessToken)
    .digest('hex');

  const profileURL = new URL(
    `${baseURL}/me`
  );

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

  let profileResponse;
  let profile;

  try {
    profileResponse = await fetch(profileURL, {
      signal: AbortSignal.timeout(12000)
    });

    profile = await profileResponse.json();

  } catch (err) {
    console.error('FACEBOOK_DIAGNOSTICO:', {
      etapa: 'profile',
      causa: 'NETWORK_OR_TIMEOUT',
      tipoError: err?.name || 'Error'
    });

    throw new Error('FACEBOOK_META_UNAVAILABLE');
  }

  // ========================================
  // COMPROBAR IDENTIDAD
  // ========================================

  if (
    !profileResponse.ok ||
    !profile?.id ||
    String(profile.id) !== String(tokenInfo.user_id)
  ) {
    console.warn('FACEBOOK_DIAGNOSTICO:', {
      etapa: 'profile',
      httpStatus: profileResponse.status,
      codigoMeta: profile?.error?.code ?? null,
      subcodigoMeta:
        profile?.error?.error_subcode ?? null,
      coincideUsuario:
        Boolean(profile?.id) &&
        String(profile.id) ===
          String(tokenInfo.user_id)
    });

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
        message:
          'Completa todos los campos obligatorios.'
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // ======================================
    // VALIDAR NOMBRE
    // ======================================

    if (
      cleanName.length < 2 ||
      cleanName.length > 80 ||
      /[\x00-\x1F\x7F]/.test(cleanName)
    ) {
      return res.status(400).json({
        message: 'Nombre inválido.'
      });
    }

    // ======================================
    // VALIDAR CORREO
    // ======================================

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      cleanEmail.length > 254 ||
      !emailRegex.test(cleanEmail)
    ) {
      return res.status(400).json({
        message:
          'Ingresa un correo electrónico válido.'
      });
    }

    // ======================================
    // VALIDAR CONTRASEÑA
    // ======================================

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
        message:
          'Servicio de autenticación no disponible.'
      });
    }

    // ======================================
    // COMPROBAR CORREO EXISTENTE
    // ======================================

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

    // ======================================
    // ENCRIPTAR CONTRASEÑA
    // ======================================

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    // ======================================
    // GUARDAR CLIENTE
    // ======================================

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

    console.error(
      'Error registrando usuario:',
      error
    );

    return res.status(500).json({
      message: 'No se pudo crear la cuenta.'
    });
  }
});

// ==========================================
// INICIO DE SESIÓN TRADICIONAL
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

    // ======================================
    // VALIDAR DATOS
    // ======================================

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
        message:
          'La opción Recordarme no es válida.'
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(503).json({
        message:
          'Servicio de autenticación no disponible.'
      });
    }

    // ======================================
    // BUSCAR USUARIO
    // ======================================

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
        message:
          'Usuario o contraseña incorrectos.'
      });
    }

    const user = result.rows[0];

    if (!user.password) {
      return res.status(401).json({
        message:
          'Usuario o contraseña incorrectos.'
      });
    }

    // ======================================
    // VERIFICAR CONTRASEÑA
    // ======================================

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        message:
          'Usuario o contraseña incorrectos.'
      });
    }

    // ======================================
    // VERIFICAR BLOQUEO
    // ======================================

    if (user.is_blocked) {
      return res.status(403).json({
        message:
          'Esta cuenta está bloqueada o no está disponible.'
      });
    }

    // ======================================
    // GENERAR SESIÓN
    // ======================================

    return res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      rememberMe,
      ...authResponse(
        user,
        'local',
        rememberMe
      )
    });

  } catch (error) {
    console.error(
      'Error en login:',
      error
    );

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

  // ========================================
  // VALIDAR TOKEN RECIBIDO
  // ========================================

  if (
    typeof accessToken !== 'string' ||
    !accessToken.trim() ||
    accessToken.length > 4096
  ) {
    return res.status(400).json({
      message:
        'Token de Facebook obligatorio.'
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(503).json({
      message:
        'Servicio de autenticación no disponible.'
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
      ? String(profile.email)
          .trim()
          .toLowerCase()
      : null;

    // ======================================
    // 2. CONECTAR A POSTGRESQL
    // ======================================

    client = await pool.connect();

    await client.query('BEGIN');
    inTransaction = true;

    // Evitar duplicados simultáneos
    await client.query(
      'SELECT pg_advisory_xact_lock(hashtext($1))',
      [`facebook:${facebookId}`]
    );

    // ======================================
    // 3. BUSCAR FACEBOOK EXISTENTE
    // ======================================

    const existing = await client.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.is_blocked
      FROM social_accounts s
      INNER JOIN users u
        ON u.id = s.user_id
      WHERE s.provider = 'facebook'
        AND s.provider_user_id = $1
      LIMIT 1
      `,
      [facebookId]
    );

    // ======================================
    // USUARIO YA REGISTRADO
    // ======================================

    if (existing.rows.length > 0) {
      const user = existing.rows[0];

      if (user.is_blocked) {
        await client.query('ROLLBACK');
        inTransaction = false;

        return res.status(403).json({
          message:
            'Esta cuenta está bloqueada.'
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
    // 4. VALIDAR CORREO DE FACEBOOK
    // ======================================

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !email ||
      !emailRegex.test(email) ||
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
    // 5. EVITAR VINCULACIÓN INSEGURA
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
    // 6. CREAR NUEVO CLIENTE
    // ======================================

    const randomPassword = crypto
      .randomBytes(48)
      .toString('hex');

    const hashedPassword = await bcrypt.hash(
      randomPassword,
      12
    );

    // Los usuarios nuevos de Facebook
    // siempre tienen rol USER.

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
    // 7. VINCULAR CUENTA SOCIAL
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

    // Guardar ambos registros juntos
    await client.query('COMMIT');
    inTransaction = false;

    // ======================================
    // 8. GENERAR JWT
    // ======================================

    return res.status(201).json({
      message:
        'Cuenta de Facebook creada.',
      ...authResponse(user, 'facebook')
    });

  } catch (error) {
    // ======================================
    // REVERTIR TRANSACCIÓN SI FALLA
    // ======================================

    if (client && inTransaction) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error(
          'Rollback fallido:',
          rollbackError
        );
      }
    }

    // ======================================
    // TOKEN INVÁLIDO
    // ======================================

    if (
      error.message === 'INVALID_FACEBOOK_TOKEN'
    ) {
      return res.status(401).json({
        code: 'INVALID_FACEBOOK_TOKEN',
        message:
          'Token de Facebook inválido o expirado.'
      });
    }

    // ======================================
    // APLICACIÓN INCORRECTA
    // ======================================

    if (
      error.message === 'FACEBOOK_APP_MISMATCH'
    ) {
      return res.status(401).json({
        code: 'FACEBOOK_APP_MISMATCH',
        message:
          'El token pertenece a otra aplicación de Facebook. ' +
          'Revisá los App ID del frontend y backend.'
      });
    }

    // ======================================
    // META RECHAZÓ LAS CREDENCIALES
    // ======================================

    if (
      error.message === 'FACEBOOK_META_REJECTED'
    ) {
      return res.status(401).json({
        code: 'FACEBOOK_META_REJECTED',
        message:
          'Meta rechazó la validación. Revisá el App ID, ' +
          'el App Secret y los logs del backend.'
      });
    }

    // ======================================
    // META NO DISPONIBLE
    // ======================================

    if (
      error.message === 'FACEBOOK_META_UNAVAILABLE'
    ) {
      return res.status(503).json({
        code: 'FACEBOOK_META_UNAVAILABLE',
        message:
          'No se pudo consultar Facebook en este momento. ' +
          'Intentá nuevamente.'
      });
    }

    // ======================================
    // FACEBOOK SIN CONFIGURAR
    // ======================================

    if (
      error.message === 'FACEBOOK_NOT_CONFIGURED'
    ) {
      return res.status(503).json({
        code: 'FACEBOOK_NOT_CONFIGURED',
        message:
          'Facebook Login no está configurado en Render.'
      });
    }

    // ======================================
    // USUARIO DUPLICADO
    // ======================================

    if (error.code === '23505') {
      return res.status(409).json({
        message:
          'La cuenta ya existe. Intentá iniciar sesión nuevamente.'
      });
    }

    // ======================================
    // ERROR GENERAL
    // ======================================

    console.error(
      'Error en Facebook Login:',
      error
    );

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
