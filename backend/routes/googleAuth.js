const express = require('express');
const { Pool } = require('pg');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const router = express.Router();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

const FRONTEND_URL = 'https://nica-smart-6z1r.onrender.com';
const GOOGLE_REDIRECT_URI = 'https://nica-smart-6z1r.onrender.com';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const googleClient = new OAuth2Client({
  clientId: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  redirectUri: GOOGLE_REDIRECT_URI
});

router.post('/', async (req, res) => {
  try {
    if (
      !GOOGLE_CLIENT_ID ||
      !GOOGLE_CLIENT_SECRET ||
      !JWT_SECRET ||
      !FRONTEND_URL
    ) {
      console.error('Faltan variables de Google OAuth');

      return res.status(503).json({
        message: 'El servidor de Google no está configurado.'
      });
    }

    const { code } = req.body || {};

    if (
      typeof code !== 'string' ||
      !code ||
      code.length > 4096
    ) {
      return res.status(400).json({
        message: 'Código de autorización de Google inválido.'
      });
    }

    const { tokens } = await googleClient.getToken({
      code,
      redirect_uri: GOOGLE_REDIRECT_URI
    });

    if (!tokens.id_token) {
      return res.status(401).json({
        message: 'Google no devolvió un token de identidad.'
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID
    });

    const profile = ticket.getPayload();

    if (
      !profile ||
      !profile.sub ||
      !profile.email ||
      profile.email_verified !== true
    ) {
      return res.status(401).json({
        message: 'No fue posible verificar la cuenta de Google.'
      });
    }

    const googleId = profile.sub;
    const email = profile.email;
    const name = profile.name || '';
    const picture = profile.picture || null;

    const result = await pool.query(
      `
      INSERT INTO google_users (
        google_id,
        email,
        name,
        picture
      )
      VALUES ($1, $2, $3, $4)

      ON CONFLICT (google_id)
      DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        picture = EXCLUDED.picture,
        updated_at = CURRENT_TIMESTAMP

      RETURNING id, google_id, email, name, picture
      `,
      [googleId, email, name, picture]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      {
        sub: String(user.id),
        provider: 'google',
        googleId: user.google_id
      },
      JWT_SECRET,
      {
        expiresIn: '2h',
        issuer: 'nica-smart',
        audience: 'nica-smart-web'
      }
    );


    return res.status(200).json({
      message: 'Inicio de sesión con Google exitoso.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        provider: 'google'
      }
    });

  } catch (error) {
    console.error(
      'Error de autenticación con Google:',
      error.message
    );

    // Evitar enviar detalles internos al navegador
    return res.status(500).json({
      message: 'No se pudo completar la autenticación con Google.'
    });
  }
});

module.exports = router;