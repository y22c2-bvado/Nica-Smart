
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const db = require('../config/db');

// ==========================================
// CONFIGURACIÓN DE NICA S-MART
// ==========================================

const FRONTEND_URL = (
  process.env.FRONTEND_URL ||
  'https://nica-smart-6z1r.onrender.com'
).replace(/\/+$/, '');

const FACEBOOK_GRAPH_URL =
  'https://graph.facebook.com/v24.0';

const hashToken = (token) =>
  crypto.createHash('sha256')
    .update(token)
    .digest('hex');

// ==========================================
// GENERAR JWT
// ==========================================

function generateToken(user, rememberMe = false) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: rememberMe ? '30d' : '1d'
    }
  );
}

// ==========================================
// FORMATO DE RESPUESTA DE AUTENTICACIÓN
// ==========================================

function authResponse(user, provider, rememberMe = false) {
  return {
    token: generateToken(user, rememberMe),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      provider
    }
  };
}

// ==========================================
// VERIFICAR TOKEN DE FACEBOOK
// ==========================================

async function verifyFacebookToken(accessToken) {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('FACEBOOK_NOT_CONFIGURED');
  }

  const debugUrl = new URL(
    `${FACEBOOK_GRAPH_URL}/debug_token`
  );

  debugUrl.searchParams.set(
    'input_token',
    accessToken
  );

  debugUrl.searchParams.set(
    'access_token',
    `${appId}|${appSecret}`
  );

  const debugResponse = await fetch(debugUrl);

  if (!debugResponse.ok) {
    throw new Error('INVALID_FACEBOOK_TOKEN');
  }

  const debugResult = await debugResponse.json();
  const tokenData = debugResult.data;

  if (
    !tokenData?.is_valid ||
    String(tokenData.app_id) !== String(appId) ||
    tokenData.type !== 'USER' ||
    !tokenData.user_id
  ) {
    throw new Error('INVALID_FACEBOOK_TOKEN');
  }

  // Verificar la identidad directamente con Meta
  const proof = crypto
    .createHmac('sha256', appSecret)
    .update(accessToken)
    .digest('hex');

  const profileUrl = new URL(
    `${FACEBOOK_GRAPH_URL}/me`
  );

  profileUrl.searchParams.set(
    'fields',
    'id,name,email'
  );

  profileUrl.searchParams.set(
    'access_token',
    accessToken
  );

  profileUrl.searchParams.set(
    'appsecret_proof',
    proof
  );

  const profileResponse = await fetch(profileUrl);

  if (!profileResponse.ok) {
    throw new Error('INVALID_FACEBOOK_TOKEN');
  }

  const profile = await profileResponse.json();

  if (
    !profile.id ||
    String(profile.id) !== String(tokenData.user_id)
  ) {
    throw new Error('INVALID_FACEBOOK_TOKEN');
  }

  return profile;
}

// ==========================================
// CONTROLADOR DE AUTENTICACIÓN
// ==========================================

const authController = {

  // ========================================
  // LOGIN TRADICIONAL
  // ========================================

  login: async (req, res) => {
    try {
      const {
        identifier,
        password,
        rememberMe
      } = req.body || {};

      if (!identifier || !password) {
        return res.status(400).json({
          message: 'Faltan datos obligatorios.'
        });
      }

      const user = await User.findByEmail(identifier);

      if (!user || !user.password) {
        return res.status(401).json({
          message: 'Credenciales inválidas.'
        });
      }

      const isMatch = await bcrypt.compare(
        password,
        user.password
      );

      if (!isMatch) {
        return res.status(401).json({
          message: 'Credenciales inválidas.'
        });
      }

      return res.json(
        authResponse(user, 'local', rememberMe)
      );

    } catch (err) {
      console.error('Error en login:', err);

      return res.status(500).json({
        message: 'Error interno del servidor.'
      });
    }
  },

  // ========================================
  // LOGIN CON FACEBOOK
  // ========================================

  facebookLogin: async (req, res) => {
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

    let client;

    try {
      // 1. Verificar con Facebook
      const profile = await verifyFacebookToken(
        accessToken
      );

      const facebookId = String(profile.id);
      const name = (
        profile.name || 'Usuario Facebook'
      ).trim();

      const email = profile.email
        ? profile.email.trim().toLowerCase()
        : null;

      // 2. Iniciar transacción en PostgreSQL
      client = await db.connect();
      await client.query('BEGIN');

      // 3. Buscar una identidad ya vinculada
      const linkedResult = await client.query(
        `
        SELECT u.id, u.name, u.email, u.role
        FROM social_accounts s
        INNER JOIN users u ON u.id = s.user_id
        WHERE s.provider = $1
          AND s.provider_user_id = $2
        `,
        ['facebook', facebookId]
      );

      if (linkedResult.rows.length > 0) {
        const user = linkedResult.rows[0];

        await client.query('COMMIT');

        return res.json(
          authResponse(user, 'facebook')
        );
      }

      // 4. Facebook puede no proporcionar email
      if (!email) {
        await client.query('ROLLBACK');

        return res.status(422).json({
          message:
            'Facebook no proporcionó un correo electrónico. ' +
            'Verificá que tu cuenta tenga un correo confirmado ' +
            'y autorizá el permiso email.'
        });
      }

      // 5. Evitar vincular cuentas ajenas por email
      const existingResult = await client.query(
        'SELECT id FROM users WHERE LOWER(email) = $1',
        [email]
      );

      if (existingResult.rows.length > 0) {
        await client.query('ROLLBACK');

        return res.status(409).json({
          code: 'ACCOUNT_ALREADY_EXISTS',
          message:
            'Ya existe una cuenta con este correo. ' +
            'Iniciá sesión con tu método habitual. ' +
            'La vinculación con Facebook deberá realizarse ' +
            'desde una sesión autenticada.'
        });
      }

      // 6. Crear un usuario nuevo
      // Contraseña aleatoria que no se comparte
      // ni permite iniciar sesión con Facebook
      // mediante la ruta tradicional.

      const randomPassword = crypto
        .randomBytes(48)
        .toString('hex');

      const hashedPassword = await bcrypt.hash(
        randomPassword,
        12
      );

      // Se utiliza el rol predeterminado
      // definido en PostgreSQL.
      const newUserResult = await client.query(
        `
        INSERT INTO users (name, email, password)
        VALUES ($1, $2, $3)
        RETURNING id, name, email, role
        `,
        [name, email, hashedPassword]
      );

      const newUser = newUserResult.rows[0];

      // 7. Vincular identidad de Facebook
      await client.query(
        `
        INSERT INTO social_accounts (
          user_id,
          provider,
          provider_user_id
        )
        VALUES ($1, $2, $3)
        `,
        [newUser.id, 'facebook', facebookId]
      );

      await client.query('COMMIT');

      // 8. Generar JWT de NICA S-MART
      return res.status(201).json(
        authResponse(newUser, 'facebook')
      );

    } catch (error) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error(
            'Error en rollback:',
            rollbackError
          );
        }
      }

      if (
        error.message === 'INVALID_FACEBOOK_TOKEN'
      ) {
        return res.status(401).json({
          message:
            'La sesión de Facebook no es válida o ha expirado.'
        });
      }

      if (
        error.message === 'FACEBOOK_NOT_CONFIGURED'
      ) {
        return res.status(503).json({
          message:
            'Facebook Login no está configurado.'
        });
      }

      // Restricciones UNIQUE de PostgreSQL
      if (error.code === '23505') {
        return res.status(409).json({
          message:
            'La cuenta ya existe. Intentá iniciar sesión nuevamente.'
        });
      }

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
  },

  // ========================================
  // RECUPERAR CONTRASEÑA
  // ========================================

  forgotPassword: async (req, res) => {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({
        message: 'El correo es obligatorio.'
      });
    }

    try {
      const userResult = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      // Evita revelar si el correo existe
      if (userResult.rows.length === 0) {
        return res.status(200).json({
          message:
            'Si el correo está registrado, recibirás un enlace.'
        });
      }

      const user = userResult.rows[0];

      const resetToken = crypto
        .randomBytes(32)
        .toString('hex');

      const tokenHash = hashToken(resetToken);

      const expiresAt = new Date(
        Date.now() + 3600000
      );

      await db.query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1',
        [user.id]
      );

      await db.query(
        `
        INSERT INTO password_reset_tokens
          (user_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
        `,
        [user.id, tokenHash, expiresAt]
      );

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const resetLink = `https://nica-smart-6z1r.onrender.com/reset-password?token=${resetToken}`;


      await transporter.sendMail({
        from: `"Nica-Smart" <${process.env.EMAIL_USER}>`,
        to: email,
        subject:
          'Recuperación de contraseña - Nica-Smart',
        html: `
          <div style="
            font-family:Arial,sans-serif;
            max-width:600px;
            margin:auto;
            padding:20px;
          ">
            <h2 style="color:#6a0dad;">
              Nica-Smart
            </h2>

            <p>
              Recibimos una solicitud para restablecer
              tu contraseña.
            </p>

            <p>
              <a
                href="${resetLink}"
                style="
                  display:inline-block;
                  padding:12px 24px;
                  background:#6a0dad;
                  color:white;
                  text-decoration:none;
                  border-radius:6px;
                "
              >
                Restablecer contraseña
              </a>
            </p>

            <p style="font-size:13px;color:#666;">
              Este enlace expira en 1 hora.
              Si no solicitaste este cambio,
              ignorá este correo.
            </p>
          </div>
        `
      });

      return res.status(200).json({
        message: 'Correo enviado exitosamente.'
      });

    } catch (error) {
      console.error(
        'Error en forgotPassword:',
        error
      );

      return res.status(500).json({
        message: 'Error al enviar el correo.'
      });
    }
  },

  // ========================================
  // RESTABLECER CONTRASEÑA
  // ========================================

  resetPassword: async (req, res) => {
    const {
      token,
      newPassword
    } = req.body || {};

    if (!token || !newPassword) {
      return res.status(400).json({
        message: 'Faltan datos.'
      });
    }

    if (
      typeof newPassword !== 'string' ||
      newPassword.length < 6
    ) {
      return res.status(400).json({
        message:
          'La contraseña debe tener al menos 6 caracteres.'
      });
    }

    let client;

    try {
      const tokenHash = hashToken(token);

      client = await db.connect();
      await client.query('BEGIN');

      // Bloqueo para impedir reutilizar un token
      const resetResult = await client.query(
        `
        SELECT *
        FROM password_reset_tokens
        WHERE token_hash = $1
          AND expires_at > NOW()
        FOR UPDATE
        `,
        [tokenHash]
      );

      if (resetResult.rows.length === 0) {
        await client.query('ROLLBACK');

        return res.status(400).json({
          message: 'Token inválido o expirado.'
        });
      }

      const resetRequest = resetResult.rows[0];

      const hashedPassword = await bcrypt.hash(
        newPassword,
        12
      );

      await client.query(
        `
        UPDATE users
        SET password = $1
        WHERE id = $2
        `,
        [
          hashedPassword,
          resetRequest.user_id
        ]
      );

      await client.query(
        `
        DELETE FROM password_reset_tokens
        WHERE user_id = $1
        `,
        [resetRequest.user_id]
      );

      await client.query('COMMIT');

      return res.status(200).json({
        message:
          'Contraseña actualizada correctamente.'
      });

    } catch (error) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error(rollbackError);
        }
      }

      console.error(
        'Error en resetPassword:',
        error
      );

      return res.status(500).json({
        message: 'Error en el servidor.'
      });

    } finally {
      if (client) {
        client.release();
      }
    }
  }
};

module.exports = authController;
