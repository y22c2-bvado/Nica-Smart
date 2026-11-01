
const express = require('express');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const pool = require('../config/db');

const router = express.Router();

// ==========================================
// CONFIGURACIÓN GENERAL
// ==========================================

const SHIPPING_COST = 150;
const MAX_ITEMS = 100;
const MAX_QUANTITY = 100;

const PAYMENT_METHODS = [
  'tarjeta_simulada',
  'transferencia_simulada'
];

const PAYMENT_TEST_CODES = [
  'APROBAR',
  'RECHAZAR'
];

// Identificadores autorizados por el simulador.
// No corresponden a cuentas bancarias reales.
const TEST_CARDS = {
  VISA_TEST: 'visa',
  MASTERCARD_TEST: 'mastercard'
};

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

    if (!['google', 'local'].includes(decoded.provider)) {
      return res.status(401).json({
        message: 'El tipo de sesión no está habilitado para compras.'
      });
    }

    let result;

    if (decoded.provider === 'google') {
      if (!decoded.sub || !decoded.googleId) {
        return res.status(401).json({
          message: 'La sesión de Google no es válida.'
        });
      }

      result = await pool.query(
        `
        SELECT id, google_id, name, email
        FROM google_users
        WHERE id = $1 AND google_id = $2
        `,
        [decoded.sub, decoded.googleId]
      );
    } else {
      if (!decoded.sub) {
        return res.status(401).json({
          message: 'La sesión del cliente no es válida.'
        });
      }

      result = await pool.query(
        `
        SELECT id, name, email
        FROM users
        WHERE id = $1
        `,
        [decoded.sub]
      );
    }

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'La cuenta del cliente no existe.'
      });
    }

    req.customer = result.rows[0];
    return next();

  } catch (error) {
    if (
      error.name === 'TokenExpiredError' ||
      error.name === 'JsonWebTokenError' ||
      error.name === 'NotBeforeError'
    ) {
      return res.status(401).json({
        message: 'Tu sesión expiró o no es válida.'
      });
    }

    console.error('Error verificando cliente:', error);

    return res.status(500).json({
      message: 'No se pudo verificar la sesión.'
    });
  }
};

// ==========================================
// RF-12: VALIDACIÓN DE PAGO SIMULADO
// ==========================================

function validateSimulatedPayment(body) {
  const {
    payment_method,
    payment_test_code,
    payment_card_brand,
    payment_test_card
  } = body;

  if (!PAYMENT_METHODS.includes(payment_method)) {
    return {
      error: 'Selecciona un método de pago válido.'
    };
  }

  if (!PAYMENT_TEST_CODES.includes(payment_test_code)) {
    return {
      error: 'El resultado de simulación no es válido.'
    };
  }

  // No recibir ni almacenar datos sensibles.
  const forbiddenFields = [
    'card_number',
    'cardNumber',
    'cvv',
    'card_cvv',
    'cardCvv',
    'card_expiration',
    'cardExpiration'
  ];

  if (
    forbiddenFields.some((field) =>
      Object.prototype.hasOwnProperty.call(body, field)
    )
  ) {
    return {
      error: 'No envíes números de tarjeta, vencimientos ni CVV.'
    };
  }

  if (payment_method === 'transferencia_simulada') {
    if (
      payment_card_brand != null ||
      payment_test_card != null
    ) {
      return {
        error: 'La transferencia no requiere datos de tarjeta.'
      };
    }

    return {
      cardBrand: null,
      paymentMethod: payment_method,
      testCode: payment_test_code
    };
  }

  // Validar una tarjeta ficticia mediante identificador.
  // El backend no confía solo en la marca que envía React.
  if (
    typeof payment_test_card !== 'string' ||
    !Object.prototype.hasOwnProperty.call(
      TEST_CARDS,
      payment_test_card
    )
  ) {
    return {
      error: 'Selecciona una tarjeta de demostración válida.'
    };
  }

  const detectedBrand = TEST_CARDS[payment_test_card];

  if (
    typeof payment_card_brand !== 'string' ||
    payment_card_brand.toLowerCase() !== detectedBrand
  ) {
    return {
      error: 'La marca de tarjeta no coincide con la tarjeta de prueba.'
    };
  }

  return {
    cardBrand: detectedBrand,
    paymentMethod: payment_method,
    testCode: payment_test_code
  };
}

// ==========================================
// RF-12: CREAR PEDIDO Y SIMULAR PAGO
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
    // VALIDAR ENTREGA
    // ==========================================

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'El carrito está vacío.'
      });
    }

    if (items.length > MAX_ITEMS) {
      return res.status(400).json({
        message: 'Se superó el límite de productos.'
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
    // VALIDAR PAGO
    // ==========================================

    const payment = validateSimulatedPayment(req.body);

    if (payment.error) {
      return res.status(400).json({
        message: payment.error
      });
    }

    // ==========================================
    // VALIDAR PRODUCTOS Y CANTIDADES
    // ==========================================

    const normalizedItems = [];
    const productIds = new Set();

    for (const item of items) {
      const productId = Number(
        item?.product_id ?? item?.id
      );
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

    normalizedItems.sort(
      (a, b) => a.product_id - b.product_id
    );

    // ==========================================
    // SIMULACIÓN DE PAGO RECHAZADO
    // ==========================================

    if (payment.testCode === 'RECHAZAR') {
      return res.status(402).json({
        message: 'Pago simulado rechazado. No se creó el pedido.',
        payment_status: 'rechazado_simulado',
        simulated: true
      });
    }

    // ==========================================
    // INICIAR TRANSACCIÓN
    // ==========================================

    client = await pool.connect();

    await client.query('BEGIN');
    transactionStarted = true;

    const validatedItems = [];
    let subtotalCents = 0;

    // ==========================================
    // CONSULTAR PRECIOS Y STOCK
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
          `Las existencias de "${product.name}" no son válidas.`
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
          `El producto "${product.name}" tiene un precio inválido.`
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
    // CALCULAR TOTAL DESDE EL SERVIDOR
    // ==========================================

    const subtotal = subtotalCents / 100;
    const shipping = SHIPPING_COST;

    const totalCents =
      subtotalCents + SHIPPING_COST * 100;

    if (!Number.isSafeInteger(totalCents)) {
      const error = new Error(
        'El total del pedido supera el límite permitido.'
      );
      error.status = 400;
      throw error;
    }

    const total = totalCents / 100;

    // ==========================================
    // IDENTIDAD DEL CLIENTE
    // ==========================================

    const customerName =
      req.customer.name || req.customer.email;

    const customerEmail = req.customer.email;

    // ==========================================
    // REFERENCIA DE PAGO SIMULADO
    // ==========================================

    const paymentReference = `SIM-${randomUUID()}`;
    const paymentStatus = 'aprobado_simulado';

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
        total,
        payment_method,
        payment_status,
        payment_reference,
        payment_card_brand
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11
      )
      RETURNING id
      `,
      [
        customerName,
        customerEmail,
        customer_phone?.trim() || null,
        customer_address.trim(),
        subtotal,
        shipping,
        total,
        payment.paymentMethod,
        paymentStatus,
        paymentReference,
        payment.cardBrand
      ]
    );

    const orderId = orderResult.rows[0].id;

    // ==========================================
    // GUARDAR PRODUCTOS Y DESCONTAR INVENTARIO
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

      await client.query(
        `
        UPDATE products
        SET stock = stock - $1
        WHERE id = $2
        `,
        [item.quantity, item.product_id]
      );
    }

    // ==========================================
    // CONFIRMAR PEDIDO
    // ==========================================

    await client.query('COMMIT');
    transactionStarted = false;

    return res.status(201).json({
      message: 'Pago simulado aprobado y pedido registrado.',
      orderId,
      subtotal,
      shipping,
      total,
      items: validatedItems,
      payment_method: payment.paymentMethod,
      payment_status: paymentStatus,
      payment_reference: paymentReference,
      payment_card_brand: payment.cardBrand,
      simulated: true,
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
        o.status,
        o.payment_method,
        o.payment_status,
        o.payment_reference,
        o.payment_card_brand,
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
    console.error('Error consultando pedidos:', error);

    return res.status(500).json({
      message: 'No se pudieron consultar los pedidos.'
    });
  }
});

module.exports = router;
