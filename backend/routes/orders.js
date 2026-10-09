
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();

// ==========================================
// CONFIGURACIÓN
// ==========================================

const SHIPPING_COST = 150;

// ==========================================
// VERIFICAR SESIÓN DEL CLIENTE
// ==========================================

const verifyCustomer = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || '';

    if (!authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Debes iniciar sesión para continuar.'
      });
    }

    const token = authorization.slice(7).trim();

    if (!token || !process.env.JWT_SECRET) {
      return res.status(401).json({
        message: 'Sesión no válida.'
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ['HS256'],
        issuer: 'nica-smart',
        audience: 'nica-smart-web'
      }
    );

    // Por ahora usamos el formato del JWT de Google.
    if (
      decoded.provider !== 'google' ||
      !decoded.sub ||
      !decoded.googleId
    ) {
      return res.status(401).json({
        message: 'El tipo de sesión no está habilitado para compras.'
      });
    }

    // Buscar al usuario autenticado en PostgreSQL
    const result = await pool.query(
      `
      SELECT id, google_id, name, email
      FROM google_users
      WHERE id = $1 AND google_id = $2
      `,
      [decoded.sub, decoded.googleId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'La cuenta del cliente no existe.'
      });
    }

    req.customer = result.rows[0];

    next();

  } catch (error) {
    if (
      error.name === 'TokenExpiredError' ||
      error.name === 'JsonWebTokenError' ||
      error.name === 'NotBeforeError'
    ) {
      return res.status(401).json({
        message: 'Tu sesión expiró o no es válida. Inicia sesión nuevamente.'
      });
    }

    console.error('Error verificando cliente:', error);

    return res.status(500).json({
      message: 'No se pudo verificar la sesión.'
    });
  }
};

// ==========================================
// CREAR PEDIDO
// POST /api/orders
// ==========================================

router.post('/', verifyCustomer, async (req, res) => {
  let client;

  try {
    const {
      customer_phone,
      customer_address,
      items
    } = req.body || {};

    // ==========================================
    // VALIDACIONES
    // ==========================================

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'El carrito está vacío.'
      });
    }

    if (items.length > 100) {
      return res.status(400).json({
        message: 'Se superó el límite de productos del pedido.'
      });
    }

    if (
      typeof customer_address !== 'string' ||
      !customer_address.trim() ||
      customer_address.length > 500
    ) {
      return res.status(400).json({
        message: 'Ingresa una dirección de entrega válida.'
      });
    }

    if (
      customer_phone != null &&
      (
        typeof customer_phone !== 'string' ||
        customer_phone.length > 30
      )
    ) {
      return res.status(400).json({
        message: 'El teléfono proporcionado no es válido.'
      });
    }

    // Validar productos y cantidades antes de consultar.
    const normalizedItems = [];

    for (const item of items) {
      const productId = item?.product_id ?? item?.id;
      const quantity = Number(item?.quantity);

      if (
        !Number.isSafeInteger(Number(productId)) ||
        Number(productId) <= 0 ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > 100
      ) {
        return res.status(400).json({
          message: 'Hay productos o cantidades inválidas.'
        });
      }

      normalizedItems.push({
        product_id: Number(productId),
        quantity
      });
    }

    // ==========================================
    // INICIAR TRANSACCIÓN
    // ==========================================

    client = await pool.connect();

    await client.query('BEGIN');

    const validatedItems = [];
    let subtotalCents = 0;

    // ==========================================
    // CONSULTAR PRECIOS REALES
    // ==========================================

    for (const item of normalizedItems) {
      const productResult = await client.query(
        `
        SELECT id, name, price
        FROM products
        WHERE id = $1
        `,
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        const error = new Error(
          `El producto ${item.product_id} ya no está disponible.`
        );
        error.status = 400;
        throw error;
      }

      const product = productResult.rows[0];
      const price = Number(product.price);

      if (!Number.isFinite(price) || price < 0) {
        const error = new Error(
          `El producto ${item.product_id} tiene un precio inválido.`
        );
        error.status = 400;
        throw error;
      }

      const unitCents = Math.round(price * 100);

      if (!Number.isSafeInteger(unitCents)) {
        const error = new Error('Precio fuera del rango permitido.');
        error.status = 400;
        throw error;
      }

      const lineCents = unitCents * item.quantity;

      if (!Number.isSafeInteger(lineCents)) {
        const error = new Error('Importe fuera del rango permitido.');
        error.status = 400;
        throw error;
      }

      subtotalCents += lineCents;

      if (!Number.isSafeInteger(subtotalCents)) {
        const error = new Error('Total fuera del rango permitido.');
        error.status = 400;
        throw error;
      }

      validatedItems.push({
        product_id: product.id,
        product_name: product.name,
        price: unitCents / 100,
        quantity: item.quantity
      });
    }

    // ==========================================
    // CALCULAR TOTAL EN EL SERVIDOR
    // ==========================================

    const subtotal = subtotalCents / 100;
    const shipping = SHIPPING_COST;
    const total = (subtotalCents + SHIPPING_COST * 100) / 100;

    // Los datos de identidad se obtienen de
    // la cuenta verificada, no de req.body.
    const customerName =
      req.customer.name || req.customer.email;

    const customerEmail = req.customer.email;

    // ==========================================
    // GUARDAR PEDIDO
    // ==========================================

    const orderResult = await client.query(
      `
      INSERT INTO orders (
        customer_name,
        customer_email,
        customer_phone,
        customer_address,
        subtotal,
        shipping,
        total
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
      `,
      [
        customerName,
        customerEmail,
        customer_phone?.trim() || null,
        customer_address.trim(),
        subtotal,
        shipping,
        total
      ]
    );

    const orderId = orderResult.rows[0].id;

    // ==========================================
    // GUARDAR PRODUCTOS DEL PEDIDO
    // ==========================================

    for (const item of validatedItems) {
      await client.query(
        `
        INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          price,
          quantity
        )
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          orderId,
          item.product_id,
          item.product_name,
          item.price,
          item.quantity
        ]
      );
    }

    // ==========================================
    // CONFIRMAR TRANSACCIÓN
    // ==========================================

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Pedido registrado exitosamente.',
      orderId,
      subtotal,
      shipping,
      total,
      customer: {
        name: customerName,
        email: customerEmail
      }
    });

  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error al revertir pedido:', rollbackError);
      }
    }

    console.error('Error creando pedido:', error);

    return res.status(error.status || 500).json({
      message:
        error.status === 400
          ? error.message
          : 'No se pudo procesar el pedido.'
    });

  } finally {
    if (client) {
      client.release();
    }
  }
});

// ==========================================
// CONSULTAR PEDIDOS DEL CLIENTE
// GET /api/orders
// ==========================================

router.get('/', verifyCustomer, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        customer_name,
        customer_email,
        customer_phone,
        customer_address,
        subtotal,
        shipping,
        total,
        created_at
      FROM orders
      WHERE customer_email = $1
      ORDER BY created_at DESC
      `,
      [req.customer.email]
    );

    return res.json(result.rows);

  } catch (error) {
    console.error('Error consultando pedidos:', error);

    return res.status(500).json({
      message: 'No se pudieron consultar los pedidos.'
    });
  }
});

module.exports = router;
