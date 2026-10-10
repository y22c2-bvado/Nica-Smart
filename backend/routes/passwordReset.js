
const express = require('express');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const pool = require('../config/db');

const router = express.Router();

// ==========================================
// CONFIGURACIÓN
// ==========================================

const RESET_EXPIRATION_MINUTES = 15;

const GENERIC_RESPONSE =
  'Si el correo está registrado, recibirás un enlace para recuperar tu contraseña.';

// ==========================================
// GENERAR HASH DEL TOKEN
// ==========================================

const hashToken = (token) => {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
};

// ==========================================
// CONFIGURAR SERVIDOR SMTP
// ==========================================

const createTransporter = () => {
  const port = Number(process.env.SMTP_PORT || 587);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,

    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// ==========================================
// VALIDAR CONFIGURACIÓN DEL CORREO
// ==========================================

const isEmailConfigured = () => {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_FROM &&
    process.env.FRONTEND_URL
  );
};

// ==========================================
// SOLICITAR RECUPERACIÓN
// POST /api/auth/forgot-password
// ==========================================

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};

    // ==========================================
    // VALIDAR CORREO ELECTRÓNICO
    // ==========================================

    if (
      typeof email !== 'string' ||
      !email.trim() ||
      email.length > 254
    ) {
      return res.status(400).json({
        message: 'Ingresa un correo electrónico válido.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        message: 'El formato del correo electrónico no es válido.'
      });
    }

    // ==========================================
    // BUSCAR CLIENTE EN POSTGRESQL
    // ==========================================

    const result = await pool.query(
      `
      SELECT id, email
      FROM users
      WHERE LOWER(email) = $1
      LIMIT 1
      `,
      [cleanEmail]
    );

    // No revelar si existe una cuenta registrada.
    if (result.rows.length === 0) {
      return res.status(200).json({
        message: GENERIC_RESPONSE
      });
    }

    // ==========================================
    // VERIFICAR CONFIGURACIÓN SMTP
    // ==========================================

    if (!isEmailConfigured()) {
      console.error(
        'Recuperación no disponible: configuración SMTP incompleta.'
      );

      return res.status(503).json({
        message: 'La recuperación de contraseñas no está disponible temporalmente.'
      });
    }

    const user = result.rows[0];

    // ==========================================
    // CREAR TOKEN SEGURO
    // ==========================================

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);

    const expirationDate = new Date(
      Date.now() + RESET_EXPIRATION_MINUTES * 60 * 1000
    );

    // ==========================================
    // GENERAR ENLACE
    // ==========================================

    const frontendUrl =
      process.env.FRONTEND_URL.trim().replace(/\/$/, '');

    const resetLink =
      `${frontendUrl}/reset-password?token=${rawToken}`;

    // ==========================================
    // ENVIAR CORREO
    // ==========================================

    const transporter = createTransporter();

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Recuperar contraseña | NICA S-MART',

      text: [
        'Hola,',
        '',
        'Recibimos una solicitud para recuperar tu contraseña de NICA S-MART.',
        '',
        'Utiliza el siguiente enlace:',
        resetLink,
        '',
        'Este enlace vence en 15 minutos y solamente puede utilizarse una vez.',
        '',
        'Si no solicitaste este cambio, puedes ignorar el mensaje.',
        '',
        'Equipo NICA S-MART'
      ].join('\n')
    });

    // ==========================================
    // GUARDAR TOKEN EN POSTGRESQL
    // ==========================================

    // Invalidar enlaces anteriores.
    await pool.query(
      `
      DELETE FROM password_reset_tokens
      WHERE user_id = $1
      `,
      [user.id]
    );

    await pool.query(
      `
      INSERT INTO password_reset_tokens (
        user_id,
        token_hash,
        expires_at
      )
      VALUES ($1, $2, $3)
      `,
      [
        user.id,
        tokenHash,
        expirationDate
      ]
    );

    return res.status(200).json({
      message: GENERIC_RESPONSE
    });

  } catch (error) {
    console.error(
      'Error solicitando recuperación:',
      error
    );

    return res.status(500).json({
      message: 'No se pudo procesar la recuperación de contraseña.'
    });
  }
});

// ==========================================
// RESTABLECER CONTRASEÑA
// POST /api/auth/reset-password
// ==========================================

router.post('/reset-password', async (req, res) => {
  let client;

  try {
    const { token, password } = req.body || {};

    // ==========================================
    // VALIDAR TOKEN
    // ==========================================

    if (
      typeof token !== 'string' ||
      !/^[a-f0-9]{64}$/i.test(token)
    ) {
      return res.status(400).json({
        message: 'El enlace de recuperación no es válido.'
      });
    }

    // ==========================================
    // VALIDAR CONTRASEÑA
    // ==========================================

    if (
      typeof password !== 'string' ||
      password.length < 8 ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      return res.status(400).json({
        message:
          'La contraseña debe tener al menos 8 caracteres y no superar 72 bytes.'
      });
    }

    const tokenHash = hashToken(token);

    // Cifrar la nueva contraseña.
    const passwordHash = await bcrypt.hash(password, 12);

    // ==========================================
    // INICIAR TRANSACCIÓN
    // ==========================================

    client = await pool.connect();

    await client.query('BEGIN');

    // ==========================================
    // VALIDAR Y CONSUMIR TOKEN
    // ==========================================

    const result = await client.query(
      `
      DELETE FROM password_reset_tokens
      WHERE token_hash = $1
        AND expires_at > NOW()
      RETURNING user_id
      `,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');

      return res.status(400).json({
        message:
          'El enlace ha expirado o ya fue utilizado. Solicita uno nuevo.'
      });
    }

    const userId = result.rows[0].user_id;

    // ==========================================
    // ACTUALIZAR CONTRASEÑA
    // ==========================================

    const updatedUser = await client.query(
      `
      UPDATE users
      SET password = $1
      WHERE id = $2
      RETURNING id
      `,
      [passwordHash, userId]
    );

    if (updatedUser.rows.length === 0) {
      throw new Error('Usuario no encontrado.');
    }

    // ==========================================
    // INVALIDAR OTROS ENLACES
    // ==========================================

    await client.query(
      `
      DELETE FROM password_reset_tokens
      WHERE user_id = $1
      `,
      [userId]
    );

    // ==========================================
    // CONFIRMAR CAMBIOS
    // ==========================================

    await client.query('COMMIT');

    return res.status(200).json({
      message: 'Tu contraseña se actualizó correctamente.'
    });

  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error(
          'Error revirtiendo la recuperación:',
          rollbackError
        );
      }
    }

    console.error(
      'Error restableciendo contraseña:',
      error
    );

    return res.status(500).json({
      message: 'No se pudo actualizar la contraseña.'
    });

  } finally {
    if (client) {
      client.release();
    }
  }
});

module.exports = router;
