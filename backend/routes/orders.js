
const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { randomUUID } = require('crypto');
const pool = require('../config/db');

const router = express.Router();

// ==========================================
// CONFIGURACIÓN
// ==========================================

const SHIPPING_COST = 150;
const MAX_ITEMS = 100;
const MAX_QUANTITY = 100;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

const PAYMENT_METHODS = [
  'tarjeta_simulada',
  'transferencia_simulada'
];

const PAYMENT_TEST_CODES = [
  'APROBAR',
  'RECHAZAR'
];

const TEST_CARDS = {
  VISA_TEST: 'visa',
  MASTERCARD_TEST: 'mastercard'
};

const ORDER_STATUSES = [
  'pendiente',
  'preparando',
  'enviado',
  'entregado',
  'cancelado'
];

// ==========================================
// SUBIDA DE FOTOGRAFÍAS
// ==========================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_PHOTO_SIZE,
    files: 1
  },

  fileFilter: (req, file, callback) => {
    if (
      ![
        'image/jpeg',
        'image/png',
        'image/webp'
      ].includes(file.mimetype)
    ) {
      return callback(
        new Error(
          'La fotografía debe ser JPG, PNG o WEBP.'
        )
      );
    }

    callback(null, true);
  }
});

function uploadPhoto(req, res, next) {
  upload.single('photo')(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message:
          error.code === 'LIMIT_FILE_SIZE'
            ? 'La fotografía no puede superar 5 MB.'
            : error.message
      });
    }

    next();
  });
}

// Verificar la firma del archivo, no solo su MIME.

function getPhotoMime(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'image/jpeg';
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([
        0x89, 0x50, 0x4e, 0x47,
        0x0d, 0x0a, 0x1a, 0x0a
      ])
    )
  ) {
    return 'image/png';
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}

// ==========================================
// VERIFICAR IDENTIDAD
// ==========================================

async function verifyCustomer(req, res, next) {
  try {
    const authorization =
      req.headers.authorization || '';

    if (!authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Debés iniciar sesión.'
      });
    }

    const token = authorization.slice(7).trim();

    if (!token || !process.env.JWT_SECRET) {
      return res.status(401).json({
        message: 'Sesión inválida.'
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
        message: 'Sesión no autorizada.'
      });
    }

    let result;

    if (decoded.provider === 'google') {
      if (!decoded.sub || !decoded.googleId) {
        return res.status(401).json({
          message: 'Sesión de Google inválida.'
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

      if (result.rows.length) {
        req.customer = {
          ...result.rows[0],
          role: 'CUSTOMER'
        };
      }
    } else {
      if (!decoded.sub) {
        return res.status(401).json({
          message: 'Sesión inválida.'
        });
      }

      result = await pool.query(
        `
        SELECT id, name, email, role
        FROM users
        WHERE id = $1
        `,
        [decoded.sub]
      );

      if (result.rows.length) {
        req.customer = result.rows[0];
      }
    }

    if (!result || !result.rows.length) {
      return res.status(401).json({
        message: 'La cuenta no existe.'
      });
    }

    next();

  } catch (error) {
    if (
      [
        'TokenExpiredError',
        'JsonWebTokenError',
        'NotBeforeError'
      ].includes(error.name)
    ) {
      return res.status(401).json({
        message: 'La sesión expiró o es inválida.'
      });
    }

    console.error('Error autenticando:', error);

    return res.status(500).json({
      message: 'No se pudo verificar la sesión.'
    });
  }
}

// ==========================================
// VERIFICAR ADMINISTRADOR
// ==========================================

function verifyAdmin(req, res, next) {
  if (
    String(req.customer?.role || '').toUpperCase() !==
    'ADMIN'
  ) {
    return res.status(403).json({
      message: 'Acceso exclusivo para administradores.'
    });
  }

  next();
}

// ==========================================
// VALIDAR PAGO SIMULADO
// ==========================================

function validateSimulatedPayment(body = {}) {
  const {
    payment_method,
    payment_test_code,
    payment_card_brand,
    payment_test_card
  } = body;

  if (!PAYMENT_METHODS.includes(payment_method)) {
    return {
      error: 'Método de pago no válido.'
    };
  }

  if (!PAYMENT_TEST_CODES.includes(payment_test_code)) {
    return {
      error: 'Resultado de simulación no válido.'
    };
  }

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
      error:
        'No se permiten números de tarjeta, CVV ni vencimientos.'
    };
  }

  if (payment_method === 'transferencia_simulada') {
    if (
      payment_card_brand != null ||
      payment_test_card != null
    ) {
      return {
        error:
          'La transferencia no requiere datos de tarjeta.'
      };
    }

    return {
      paymentMethod: payment_method,
      testCode: payment_test_code,
      cardBrand: null
    };
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      TEST_CARDS,
      payment_test_card
    )
  ) {
    return {
      error: 'Seleccioná una tarjeta de prueba válida.'
    };
  }

  const brand = TEST_CARDS[payment_test_card];

  if (
    String(payment_card_brand || '').toLowerCase() !==
    brand
  ) {
    return {
      error: 'Marca de tarjeta de prueba no válida.'
    };
  }

  return {
    paymentMethod: payment_method,
    testCode: payment_test_code,
    cardBrand: brand
  };
}

// ==========================================
// CONSULTAR ARTÍCULOS DE UN PEDIDO
// ==========================================

const ORDER_ITEMS_SQL = `
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
`;

// ==========================================
// RESUMEN DE PEDIDO CON ENTREGA
// ==========================================

const ORDER_SELECT_SQL = `
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
    o.created_at,
    o.payment_method,
    o.payment_status,
    o.payment_reference,
    o.payment_card_brand,
    o.shipped_at,
    o.delivered_at,
    o.delivery_confirmed_at,

    CASE
      WHEN dc.order_id IS NOT NULL THEN true
      ELSE false
    END AS has_delivery_photo,

    dc.confirmed_at AS customer_confirmed_at,

    ${ORDER_ITEMS_SQL}

  FROM orders o
  LEFT JOIN delivery_confirmations dc
    ON dc.order_id = o.id
`;

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

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > MAX_ITEMS
    ) {
      return res.status(400).json({
        message: 'El carrito está vacío o supera el límite.'
      });
    }

    if (
      typeof customer_address !== 'string' ||
      customer_address.trim().length < 10 ||
      customer_address.length > 500
    ) {
      return res.status(400).json({
        message: 'Ingresá una dirección válida.'
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
        message: 'Teléfono inválido.'
      });
    }

    const payment = validateSimulatedPayment(req.body);

    if (payment.error) {
      return res.status(400).json({
        message: payment.error
      });
    }

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
        quantity > MAX_QUANTITY ||
        productIds.has(productId)
      ) {
        return res.status(400).json({
          message: 'Producto o cantidad inválida.'
        });
      }

      productIds.add(productId);

      normalizedItems.push({
        product_id: productId,
        quantity
      });
    }

    if (payment.testCode === 'RECHAZAR') {
      return res.status(402).json({
        message: 'Pago de prueba rechazado.',
        payment_status: 'rechazado_simulado',
        simulated: true
      });
    }

    normalizedItems.sort(
      (a, b) => a.product_id - b.product_id
    );

    client = await pool.connect();

    await client.query('BEGIN');
    transactionStarted = true;

    const validatedItems = [];
    let subtotalCents = 0;

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

      if (!productResult.rows.length) {
        const error = new Error(
          `El producto #${item.product_id} no está disponible.`
        );
        error.status = 400;
        throw error;
      }

      const product = productResult.rows[0];

      const price = Number(product.price);
      const stock = Number(product.stock);

      if (
        !Number.isSafeInteger(stock) ||
        stock < item.quantity
      ) {
        const error = new Error(
          `Existencias insuficientes de "${product.name}".`
        );
        error.status = 400;
        throw error;
      }

      if (!Number.isFinite(price) || price < 0) {
        const error = new Error(
          `Precio inválido de "${product.name}".`
        );
        error.status = 400;
        throw error;
      }

      const unitCents = Math.round(price * 100);
      const lineCents = unitCents * item.quantity;

      if (
        !Number.isSafeInteger(unitCents) ||
        !Number.isSafeInteger(lineCents) ||
        !Number.isSafeInteger(
          subtotalCents + lineCents
        )
      ) {
        const error = new Error(
          'El total supera el límite permitido.'
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

    const subtotal = subtotalCents / 100;
    const shipping = SHIPPING_COST;

    const totalCents =
      subtotalCents + SHIPPING_COST * 100;

    if (!Number.isSafeInteger(totalCents)) {
      const error = new Error('Total no válido.');
      error.status = 400;
      throw error;
    }

    const total = totalCents / 100;

    const customerName =
      req.customer.name || req.customer.email;

    const customerEmail = req.customer.email;

    const paymentReference = `SIM-${randomUUID()}`;

    const result = await client.query(
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
        payment_card_brand,
        status
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12
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
        'aprobado_simulado',
        paymentReference,
        payment.cardBrand,
        'pendiente'
      ]
    );

    const orderId = result.rows[0].id;

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

    await client.query('COMMIT');
    transactionStarted = false;

    return res.status(201).json({
      message: 'Pedido registrado correctamente.',
      orderId,
      subtotal,
      shipping,
      total,
      status: 'pendiente',
      items: validatedItems,
      payment_method: payment.paymentMethod,
      payment_status: 'aprobado_simulado',
      payment_reference: paymentReference,
      payment_card_brand: payment.cardBrand,
      simulated: true
    });

  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error rollback:', rollbackError);
      }
    }

    console.error('Error creando pedido:', error);

    return res.status(error.status || 500).json({
      message:
        error.status === 400
          ? error.message
          : 'No se pudo registrar el pedido.'
    });

  } finally {
    client?.release();
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
      ${ORDER_SELECT_SQL}
      WHERE LOWER(o.customer_email) = LOWER($1)
      ORDER BY o.created_at DESC, o.id DESC
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

// ==========================================
// CONSULTAR UN PEDIDO DEL CLIENTE
// GET /api/orders/:id
// ==========================================

router.get('/:id', verifyCustomer, async (req, res) => {
  const orderId = Number(req.params.id);

  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    return res.status(400).json({
      message: 'Número de pedido inválido.'
    });
  }

  try {
    const result = await pool.query(
      `
      ${ORDER_SELECT_SQL}
      WHERE o.id = $1
        AND LOWER(o.customer_email) = LOWER($2)
      `,
      [orderId, req.customer.email]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        message: 'Pedido no encontrado.'
      });
    }

    return res.json(result.rows[0]);

  } catch (error) {
    console.error('Error consultando pedido:', error);

    return res.status(500).json({
      message: 'No se pudo consultar el pedido.'
    });
  }
});

// ==========================================
// CONFIRMAR RECEPCIÓN DEL CLIENTE
//
// POST /api/orders/:id/confirm-delivery
//
// FormData:
// photo: archivo JPG, PNG o WEBP
//
// El cliente confirma que recibió el producto.
// La foto se guarda en PostgreSQL.
// ==========================================

router.post(
  '/:id/confirm-delivery',
  verifyCustomer,
  uploadPhoto,
  async (req, res) => {
    const orderId = Number(req.params.id);

    if (
      !Number.isSafeInteger(orderId) ||
      orderId <= 0
    ) {
      return res.status(400).json({
        message: 'Número de pedido inválido.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message:
          'Adjuntá una fotografía del producto recibido.'
      });
    }

    const actualMime = getPhotoMime(req.file.buffer);

    if (
      !actualMime ||
      actualMime !== req.file.mimetype
    ) {
      return res.status(400).json({
        message: 'La fotografía no es válida.'
      });
    }

    let client;
    let transactionStarted = false;

    try {
      client = await pool.connect();

      await client.query('BEGIN');
      transactionStarted = true;

      const result = await client.query(
        `
        SELECT
          id,
          status,
          delivery_confirmed_at
        FROM orders
        WHERE id = $1
          AND LOWER(customer_email) = LOWER($2)
        FOR UPDATE
        `,
        [orderId, req.customer.email]
      );

      if (!result.rows.length) {
        await client.query('ROLLBACK');
        transactionStarted = false;

        return res.status(404).json({
          message: 'Pedido no encontrado.'
        });
      }

      const order = result.rows[0];

      if (order.delivery_confirmed_at) {
        await client.query('ROLLBACK');
        transactionStarted = false;

        return res.status(409).json({
          message:
            'Ya confirmaste la recepción de este pedido.'
        });
      }

      if (
        !['enviado', 'entregado'].includes(
          String(order.status).toLowerCase()
        )
      ) {
        await client.query('ROLLBACK');
        transactionStarted = false;

        return res.status(409).json({
          message:
            'Solo podés confirmar un pedido enviado o marcado como entregado.'
        });
      }

      const confirmationResult = await client.query(
        `
        INSERT INTO delivery_confirmations (
          order_id,
          customer_email,
          photo_data,
          photo_mime,
          photo_size,
          confirmed_at
        )
        VALUES (
          $1, $2, $3, $4, $5, NOW()
        )
        RETURNING confirmed_at
        `,
        [
          orderId,
          req.customer.email,
          req.file.buffer,
          actualMime,
          req.file.size
        ]
      );

      const updated = await client.query(
        `
        UPDATE orders
        SET
          status = 'entregado',
          delivered_at = COALESCE(
            delivered_at,
            NOW()
          ),
          delivery_confirmed_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          status,
          shipped_at,
          delivered_at,
          delivery_confirmed_at
        `,
        [orderId]
      );

      await client.query('COMMIT');
      transactionStarted = false;

      return res.json({
        message:
          'Recepción confirmada correctamente.',
        order: {
          ...updated.rows[0],
          has_delivery_photo: true,
          customer_confirmed_at:
            confirmationResult.rows[0].confirmed_at
        }
      });

    } catch (error) {
      if (client && transactionStarted) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error(
            'Error al revertir confirmación:',
            rollbackError
          );
        }
      }

      console.error(
        'Error confirmando recepción:',
        error
      );

      return res.status(500).json({
        message:
          'No se pudo confirmar la recepción.'
      });

    } finally {
      client?.release();
    }
  }
);

// ==========================================
// VER FOTO DE RECEPCIÓN
//
// GET /api/orders/:id/proof
//
// Solo el propietario o un administrador.
// ==========================================

router.get(
  '/:id/proof',
  verifyCustomer,
  async (req, res) => {
    const orderId = Number(req.params.id);

    if (
      !Number.isSafeInteger(orderId) ||
      orderId <= 0
    ) {
      return res.status(400).json({
        message: 'Pedido inválido.'
      });
    }

    try {
      const result = await pool.query(
        `
        SELECT
          dc.photo_data,
          dc.photo_mime
        FROM delivery_confirmations dc
        INNER JOIN orders o
          ON o.id = dc.order_id
        WHERE o.id = $1
          AND (
            LOWER(o.customer_email) = LOWER($2)
            OR $3 = true
          )
        `,
        [
          orderId,
          req.customer.email,
          String(req.customer.role || '')
            .toUpperCase() === 'ADMIN'
        ]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          message: 'Fotografía no disponible.'
        });
      }

      const photo = result.rows[0];

      res.set({
        'Content-Type': photo.photo_mime,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline'
      });

      return res.send(photo.photo_data);

    } catch (error) {
      console.error(
        'Error consultando fotografía:',
        error
      );

      return res.status(500).json({
        message:
          'No se pudo consultar la fotografía.'
      });
    }
  }
);

// ==========================================
// LISTA ADMINISTRATIVA DE PEDIDOS
//
// GET /api/orders/admin/all
//
// Incluye horas y confirmaciones.
// ==========================================

router.get(
  '/admin/all',
  verifyCustomer,
  verifyAdmin,
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        ${ORDER_SELECT_SQL}
        ORDER BY o.created_at DESC, o.id DESC
        `
      );

      return res.json(result.rows);

    } catch (error) {
      console.error(
        'Error consultando pedidos administrativos:',
        error
      );

      return res.status(500).json({
        message:
          'No se pudieron cargar los pedidos.'
      });
    }
  }
);

// ==========================================
// ACTUALIZAR ESTADO COMO ADMINISTRADOR
//
// PATCH /api/orders/admin/:id/status
//
// Al enviar se registra shipped_at.
// Al entregar se registra delivered_at.
// La confirmación del cliente es independiente.
// ==========================================

router.patch(
  '/admin/:id/status',
  verifyCustomer,
  verifyAdmin,
  async (req, res) => {
    const orderId = Number(req.params.id);

    const newStatus = String(
      req.body?.status || ''
    ).trim().toLowerCase();

    if (
      !Number.isSafeInteger(orderId) ||
      orderId <= 0
    ) {
      return res.status(400).json({
        message: 'Pedido inválido.'
      });
    }

    if (!ORDER_STATUSES.includes(newStatus)) {
      return res.status(400).json({
        message: 'Estado de pedido inválido.'
      });
    }

    let client;
    let transactionStarted = false;

    try {
      client = await pool.connect();

      await client.query('BEGIN');
      transactionStarted = true;

      const current = await client.query(
        `
        SELECT
          id,
          status,
          shipped_at,
          delivered_at,
          delivery_confirmed_at
        FROM orders
        WHERE id = $1
        FOR UPDATE
        `,
        [orderId]
      );

      if (!current.rows.length) {
        await client.query('ROLLBACK');
        transactionStarted = false;

        return res.status(404).json({
          message: 'Pedido no encontrado.'
        });
      }

      const order = current.rows[0];

      if (order.delivery_confirmed_at) {
        await client.query('ROLLBACK');
        transactionStarted = false;

        return res.status(409).json({
          message:
            'El cliente ya confirmó la entrega. El estado no puede modificarse desde esta operación.'
        });
      }

      // No cancelar pedidos que ya salieron
      // para entrega o fueron entregados.

      if (
        newStatus === 'cancelado' &&
        (
          order.shipped_at ||
          order.delivered_at
        )
      ) {
        await client.query('ROLLBACK');
        transactionStarted = false;

        return res.status(409).json({
          message:
            'No podés cancelar un pedido que ya fue enviado.'
        });
      }

      // Evitar volver a estados anteriores.

      const rank = {
        pendiente: 1,
        preparando: 2,
        enviado: 3,
        entregado: 4
      };

      if (
        newStatus !== 'cancelado' &&
        order.status !== 'cancelado' &&
        rank[newStatus] < rank[order.status]
      ) {
        await client.query('ROLLBACK');
        transactionStarted = false;

        return res.status(409).json({
          message:
            'No podés retroceder el progreso de la entrega.'
        });
      }

      if (
        order.status === 'cancelado' &&
        newStatus !== 'cancelado'
      ) {
        await client.query('ROLLBACK');
        transactionStarted = false;

        return res.status(409).json({
          message:
            'No podés reactivar un pedido cancelado desde esta operación.'
        });
      }

      const result = await client.query(
        `
        UPDATE orders
        SET
          status = $1,

          shipped_at = CASE
            WHEN $1 IN ('enviado', 'entregado')
            THEN COALESCE(shipped_at, NOW())
            ELSE shipped_at
          END,

          delivered_at = CASE
            WHEN $1 = 'entregado'
            THEN COALESCE(delivered_at, NOW())
            ELSE delivered_at
          END

        WHERE id = $2

        RETURNING
          id,
          status,
          shipped_at,
          delivered_at,
          delivery_confirmed_at
        `,
        [newStatus, orderId]
      );

      await client.query('COMMIT');
      transactionStarted = false;

      return res.json({
        message:
          'Estado del pedido actualizado correctamente.',
        order: result.rows[0]
      });

    } catch (error) {
      if (client && transactionStarted) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error(
            'Error al revertir actualización:',
            rollbackError
          );
        }
      }

      console.error(
        'Error actualizando pedido:',
        error
      );

      return res.status(500).json({
        message:
          'No se pudo actualizar el estado.'
      });

    } finally {
      client?.release();
    }
  }
);

module.exports = router;
