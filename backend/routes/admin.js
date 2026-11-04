const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const upload = require('../config/upload'); // <-- IMPORTAMOS MULTER

const router = express.Router();

const httpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const isPositiveId = (value) => {
  return (
    /^\d+$/.test(String(value)) &&
    Number.isSafeInteger(Number(value)) &&
    Number(value) > 0
  );
};

const validateProduct = (data) => {
  const name = data.name?.trim();
  const category = data.category?.trim() || '';
  const brand = data.brand?.trim() || '';
  const brand_url = data.brand_url?.trim() || '';
  
  // <-- NUEVO: Capturamos el estado is_new (viene como string desde FormData)
  const is_new = data.is_new === 'true' || data.is_new === true;

  if (category.length > 100) {
    throw httpError(400, 'La categoría no puede superar 100 caracteres.');
  }

  if (brand.length > 120) {
    throw httpError(400, 'La marca no puede superar 120 caracteres.');
  }

  const description = data.description?.trim() || '';
  const price = Number(data.price);
  const stock = Number(data.stock);

  if (!name || name.length > 150) {
    throw httpError(400, 'El nombre debe tener entre 1 y 150 caracteres.');
  }

  if (description.length > 3000) {
    throw httpError(400, 'La descripción no puede superar los 3000 caracteres.');
  }

  if (!Number.isFinite(price) || price < 0) {
    throw httpError(400, 'El precio es inválido.');
  }

  if (!Number.isSafeInteger(stock) || stock < 0) {
    throw httpError(400, 'Las existencias son inválidas.');
  }

  const originalInput = data.original_price;

  const originalRaw =
    originalInput === undefined ||
    originalInput === null ||
    String(originalInput).trim() === ''
      ? price
      : Number(originalInput);

  if (!Number.isFinite(originalRaw) || originalRaw < 0) {
    throw httpError(400, 'El precio original es inválido.');
  }

  if (originalRaw < price) {
    throw httpError(400, 'El precio original debe ser mayor o igual al precio con descuento.');
  }

  const original_price = originalRaw > price ? originalRaw : null;

  return {
    name,
    category,
    description,
    price,
    original_price,
    stock,
    brand: brand || null,
    brand_url: brand_url || null,
    is_new // <-- NUEVO: Lo retornamos para usarlo en la BD
  };
};

const requireAdmin = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || '';

    if (!authorization.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Debes iniciar sesión.' });
    }

    const token = authorization.slice(7).trim();

    if (!process.env.JWT_SECRET) {
      return res.status(503).json({ message: 'Servicio de autenticación no disponible.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'nica-smart',
      audience: 'nica-smart-web'
    });

    if (!isPositiveId(decoded.sub)) {
      return res.status(401).json({ message: 'Sesión inválida.' });
    }

    let result;

    if (decoded.provider === 'local') {
      result = await pool.query(
        `SELECT id, name, email, role, is_blocked FROM users WHERE id = $1`,
        [decoded.sub]
      );
    } else {
      return res.status(403).json({ message: 'Esta cuenta no tiene acceso administrativo.' });
    }

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'La cuenta no existe.' });
    }

    const admin = result.rows[0];

    if (admin.is_blocked) {
      return res.status(403).json({ message: 'La cuenta está bloqueada.' });
    }

    if (String(admin.role).toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ message: 'No tienes permisos de administrador.' });
    }

    req.admin = admin;
    next();

  } catch (error) {
    if (
      error.name === 'TokenExpiredError' ||
      error.name === 'JsonWebTokenError' ||
      error.name === 'NotBeforeError'
    ) {
      return res.status(401).json({ message: 'Sesión expirada o inválida.' });
    }

    console.error('Error verificando administrador:', error);
    return res.status(500).json({ message: 'No se pudo verificar el administrador.' });
  }
};

router.use(requireAdmin);

router.get('/stats', async (req, res) => {
  try {
    const [products, users, orders] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE stock <= 5)::int AS low_stock FROM products`),
      pool.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_blocked = TRUE)::int AS blocked FROM users`),
      pool.query(`SELECT COUNT(*)::int AS total FROM orders`)
    ]);

    return res.json({
      products: products.rows[0],
      users: users.rows[0],
      orders: orders.rows[0]
    });

  } catch (error) {
    console.error('Error consultando estadísticas:', error);
    return res.status(500).json({ message: 'No se pudieron cargar las estadísticas.' });
  }
});

// GET: Leer productos (Incluimos is_new)
router.get('/products', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id, name, category, description,
        price, original_price, stock, images, brand, brand_url, is_new, created_at
      FROM products
      ORDER BY created_at DESC, id DESC
      `
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('Error consultando productos:', error);
    return res.status(500).json({ message: 'No se pudieron consultar los productos.' });
  }
});

// POST: Crear producto con imágenes, marca y is_new
router.post('/products', upload.array('images', 4), async (req, res) => {
  try {
    const product = validateProduct(req.body || {});
    
    const imageUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const result = await pool.query(
      `
      INSERT INTO products (
        name, category, description, price, original_price, stock, images, brand, brand_url, is_new
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
      `,
      [
        product.name,
        product.category,
        product.description,
        product.price,
        product.original_price,
        product.stock,
        imageUrls,
        product.brand,
        product.brand_url,
        product.is_new
      ]
    );

    return res.status(201).json({
      message: 'Producto creado correctamente.',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Error creando producto:', error);
    return res.status(error.status || 500).json({
      message: error.status === 400 ? error.message : 'No se pudo crear el producto.'
    });
  }
});

// PUT: Actualizar producto con imágenes, marca y is_new
router.put('/products/:id', upload.array('images', 4), async (req, res) => {
  try {
    if (!isPositiveId(req.params.id)) {
      return res.status(400).json({ message: 'ID del producto inválido.' });
    }

    const product = validateProduct(req.body || {});
    
    let imageUrls = [];

    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    } else if (req.body.existingImages) {
      try {
        imageUrls = JSON.parse(req.body.existingImages);
      } catch (e) {
        imageUrls = [];
      }
    }

    const result = await pool.query(
      `
      UPDATE products
      SET
        name = $1, category = $2, description = $3,
        price = $4, original_price = $5, stock = $6, images = $7,
        brand = $8, brand_url = $9, is_new = $10
      WHERE id = $11
      RETURNING *
      `,
      [
        product.name,
        product.category,
        product.description,
        product.price,
        product.original_price,
        product.stock,
        imageUrls,
        product.brand,
        product.brand_url,
        product.is_new,
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    return res.json({
      message: 'Producto actualizado correctamente.',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Error actualizando producto:', error);
    return res.status(error.status || 500).json({
      message: error.status === 400 ? error.message : 'No se pudo actualizar el producto.'
    });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    if (!isPositiveId(req.params.id)) {
      return res.status(400).json({ message: 'ID del producto inválido.' });
    }

    const result = await pool.query(
      `DELETE FROM products WHERE id = $1 RETURNING id, name`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    return res.json({
      message: 'Producto eliminado correctamente.',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Error eliminando producto:', error);
    if (error.code === '23503') {
      return res.status(409).json({
        message: 'Este producto tiene registros relacionados y no puede eliminarse.'
      });
    }
    return res.status(500).json({ message: 'No se pudo eliminar el producto.' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, is_blocked FROM users ORDER BY id DESC`
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('Error consultando usuarios:', error);
    return res.status(500).json({ message: 'No se pudieron consultar los usuarios.' });
  }
});

router.patch('/users/:id/block', async (req, res) => {
  try {
    if (!isPositiveId(req.params.id)) {
      return res.status(400).json({ message: 'ID del usuario inválido.' });
    }

    if (typeof req.body?.blocked !== 'boolean') {
      return res.status(400).json({ message: 'Debes indicar blocked: true o false.' });
    }

    if (String(req.admin.id) === String(req.params.id)) {
      return res.status(403).json({ message: 'No puedes bloquear tu propia cuenta.' });
    }

    const result = await pool.query(
      `
      UPDATE users
      SET is_blocked = $1
      WHERE id = $2 AND UPPER(role) <> 'ADMIN'
      RETURNING id, name, email, role, is_blocked
      `,
      [req.body.blocked, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado o cuenta administrativa protegida.' });
    }

    return res.json({
      message: req.body.blocked ? 'Usuario bloqueado correctamente.' : 'Usuario desbloqueado correctamente.',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Error cambiando bloqueo:', error);
    return res.status(500).json({ message: 'No se pudo actualizar el usuario.' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    if (!isPositiveId(req.params.id)) {
      return res.status(400).json({ message: 'ID del usuario inválido.' });
    }

    if (String(req.admin.id) === String(req.params.id)) {
      return res.status(403).json({ message: 'No puedes eliminar tu propia cuenta.' });
    }

    const result = await pool.query(
      `
      DELETE FROM users
      WHERE id = $1 AND UPPER(role) <> 'ADMIN'
      RETURNING id, name, email
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado o cuenta administrativa protegida.' });
    }

    return res.json({
      message: 'Usuario eliminado correctamente.',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Error eliminando usuario:', error);
    if (error.code === '23503') {
      return res.status(409).json({ message: 'No puede eliminarse el usuario porque tiene información relacionada.' });
    }
    return res.status(500).json({ message: 'No se pudo eliminar el usuario.' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        o.id, o.user_id, o.customer_name, o.customer_email,
        o.customer_phone, o.customer_address, o.subtotal,
        o.shipping, o.total, o.status, o.created_at,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'product_id', oi.product_id,
                'product_name', oi.product_name,
                'price', oi.price,
                'quantity', oi.quantity,
                'images', p.images
              )
              ORDER BY oi.product_id
            )
            FROM order_items oi
            LEFT JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id = o.id
          ),
          '[]'::json
        ) AS items
      FROM orders o
      ORDER BY o.created_at DESC, o.id DESC
      `
    );

    return res.json(result.rows);

  } catch (error) {
    console.error('Error consultando pedidos:', error);
    return res.status(500).json({ message: 'No se pudieron consultar los pedidos.' });
  }
});

router.patch('/orders/:id/status', async (req, res) => {
  try {
    if (!isPositiveId(req.params.id)) {
      return res.status(400).json({ message: 'ID del pedido inválido.' });
    }

    // <-- NUEVO: Se agregó 'preparando' a los estados válidos
    const validStatuses = ['pendiente', 'preparando', 'enviado', 'entregado', 'cancelado'];
    const status = String(req.body?.status || '').toLowerCase();

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Estado no válido.' });
    }

    const result = await pool.query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING id, status`,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }

    return res.json({
      message: 'Estado del pedido actualizado correctamente.',
      order: result.rows[0]
    });

  } catch (error) {
    console.error('Error actualizando pedido:', error);
    return res.status(500).json({ message: 'No se pudo actualizar el estado del pedido.' });
  }
});

module.exports = router;