require('dotenv').config();
const nodemailer = require('nodemailer');

async function test() {
  console.log('📧 Probando configuración SMTP...');
  console.log('Usuario:', process.env.SMTP_USER);
  console.log('Pass (primeros 4):', process.env.SMTP_PASS?.substring(0, 4) + '...');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    await transporter.verify();
    console.log('✅ Conexión SMTP verificada correctamente.');

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_USER, // te lo envías a ti mismo para probar
      subject: 'Prueba Nica-Smart',
      html: '<h1>¡Funciona! 🎉</h1>'
    });
    console.log('✅ Correo de prueba enviado.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

test();