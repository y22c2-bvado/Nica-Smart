
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();

// ==========================================
// CONFIGURACIÓN
// ==========================================

const SHIPPING_COST = 150;
const MAX_ITEMS = 100;
const MAX_QUANTITY = 100;

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

    if (
      decoded.provider !== 'google' ||
      !decoded.sub ||
      !decoded.googleId
    ) {
      return res.status(401).json({
        message: 'El tipo de sesión no está habilitado para compras.'
      });
    }

    const result = await pool.query(
      `
      SELECT id, google_id, name, email
      FROM google_users
      WHERE id = $1
        AND google_id = $2
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
  let transactionStarted = false;

  try {
    const {
      customer_phone,
      customer_address,
      items
    } = req.body || {};

    // ==========================================
    // VALIDAR DATOS DE ENTREGA
    // ==========================================

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'El carrito está vacío.'
      });
    }

    if (items.length > MAX_ITEMS) {
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

    // ==========================================
    // VALIDAR PRODUCTOS Y CANTIDADES
    // ==========================================

    const normalizedItems = [];
    const productIds = new Set();

    for (const item of items) {
      const rawProductId = item?.product_id ?? item?.id;

      const productId = Number(rawProductId);
      const quantity = Number(item?.quantity);

      if (
        !Number.isSafeInteger(productId) ||
        productId <= 0 ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > MAX_QUANTITY
      ) {
        return res.status(400).json({
          message: 'Hay productos o cantidades inválidas.'
        });
      }

      if (productIds.has(productId)) {
        return res.status(400).json({
          message: 'El carrito contiene productos duplicados.'
        });
      }

      productIds.add(productId);

      normalizedItems.push({
        product_id: productId,
        quantity
      });
    }

    // Ordenar IDs para bloquear siempre en el mismo orden
    normalizedItems.sort(
      (a, b) => a.product_id - b.product_id
    );

    // ==========================================
    // INICIAR TRANSACCIÓN
    // ==========================================

    client = await pool.connect();

    await client.query('BEGIN');
    transactionStarted = true;

    const validatedItems = [];
    let subtotalCents = 0;

    // ==========================================
    // CONSULTAR PRECIOS Y EXISTENCIAS REALES
    // ==========================================

    for (const item of normalizedItems) {
      const productResult = await client.query(
        `
        SELECT id, name, price, stock
        FROM products
        WHERE id = $1
        FOR UPDATE
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
      const stock = Number(product.stock);

      if (
        !Number.isSafeInteger(stock) ||
        stock < 0
      ) {
        const error = new Error(
          `Las existencias del producto ${product.name} no son válidas.`
        );

        error.status = 400;
        throw error;
      }

      if (stock < item.quantity) {
        const error = new Error(
          `No hay suficientes existencias de "${product.name}". Disponibles: ${stock}.`
        );

        error.status = 400;
        throw error;
      }

      if (!Number.isFinite(price) || price < 0) {
        const error = new Error(
          `El producto ${product.name} tiene un precio inválido.`
        );

        error.status = 400;
        throw error;
      }

      const unitCents = Math.round(price * 100);
      const lineCents = unitCents * item.quantity;

      if (
        !Number.isSafeInteger(unitCents) ||
        !Number.isSafeInteger(lineCents) ||
        !Number.isSafeInteger(subtotalCents + lineCents)
      ) {
        const error = new Error(
          'El importe del pedido supera el límite permitido.'
        );

        error.status = 400;
        throw error;
      }

      subtotalCents += lineCents;

      validatedItems.push({
        product_id: product.id,
        product_name: product.name,
        price: unitCents / 100,
        quantity: item.quantity
      });
    }

    // ==========================================
    // CALCULAR TOTAL DESDE EL BACKEND
    // ==========================================

    const subtotal = subtotalCents / 100;
    const shipping = SHIPPING_COST;
    const total = (
      subtotalCents + SHIPPING_COST * 100
    ) / 100;

    // ==========================================
    // IDENTIDAD DEL CLIENTE
    // ==========================================

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
    // GUARDAR LOS PRODUCTOS DEL PEDIDO
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

      // Descontar existencias
      await client.query(
        `
        UPDATE products
        SET stock = stock - $1
        WHERE id = $2
        `,
        [
          item.quantity,
          item.product_id
        ]
      );
    }

    // ==========================================
    // CONFIRMAR PEDIDO
    // ==========================================

    await client.query('COMMIT');
    transactionStarted = false;

    return res.status(201).json({
      message: 'Pedido registrado exitosamente.',
      orderId,
      subtotal,
      shipping,
      total,
      items: validatedItems,
      customer: {
        name: customerName,
        email: customerEmail
      }
    });

  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error(
          'Error al revertir la transacción:',
          rollbackError
        );
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
        o.id,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.customer_address,
        o.subtotal,
        o.shipping,
        o.total,
        o.created_at,

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'product_id', oi.product_id,
                'product_name', oi.product_name,
                'price', oi.price,
                'quantity', oi.quantity,
                'image', p.image
              )
              ORDER BY oi.product_id
            )
            FROM order_items oi
            LEFT JOIN products p
              ON p.id = oi.product_id
            WHERE oi.order_id = o.id
          ),
          '[]'::json
        ) AS items

      FROM orders o

      WHERE LOWER(o.customer_email) = LOWER($1)

      ORDER BY o.created_at DESC, o.id DESC
      `,
      [req.customer.email]
    );

    return res.status(200).json(result.rows);

  } catch (error) {
    console.error(
      'Error consultando pedidos:',
      error
    );

    return res.status(500).json({
      message: 'No se pudieron consultar los pedidos.'
    });
  }
});

module.exports = router;
