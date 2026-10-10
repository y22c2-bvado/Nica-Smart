
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

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
  const description = data.description?.trim() || '';
  const image = data.image?.trim() || '';
  const price = Number(data.price);
  const stock = Number(data.stock);

  if (!name || name.length > 150) {
    throw httpError(
      400,
      'El nombre debe tener entre 1 y 150 caracteres.'
    );
  }

  if (description.length > 3000) {
    throw httpError(
      400,
      'La descripción no puede superar los 3000 caracteres.'
    );
  }

  if (!Number.isFinite(price) || price < 0) {
    throw httpError(400, 'El precio es inválido.');
  }

  if (
    !Number.isSafeInteger(stock) ||
    stock < 0
  ) {
    throw httpError(400, 'Las existencias son inválidas.');
  }

  if (image) {
    try {
      const url = new URL(image);

      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Protocolo inválido');
      }
    } catch {
      throw httpError(
        400,
        'La imagen debe ser una URL HTTP o HTTPS válida.'
      );
    }
  }

  return {
    name,
    description,
    image: image || null,
    price,
    stock
  };
};

// ==========================================
// VERIFICAR JWT Y ROL ADMIN
// ==========================================

const requireAdmin = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || '';

    if (!authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Debes iniciar sesión.'
      });
    }

    const token = authorization.slice(7).trim();

    if (!process.env.JWT_SECRET) {
      return res.status(503).json({
        message: 'Servicio de autenticación no disponible.'
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

    if (!isPositiveId(decoded.sub)) {
      return res.status(401).json({
        message: 'Sesión inválida.'
      });
    }

    let result;

    if (decoded.provider === 'local') {
      result = await pool.query(
        `
        SELECT id, name, email, role, is_blocked
        FROM users
        WHERE id = $1
        `,
        [decoded.sub]
      );
    } else {
      return res.status(403).json({
        message: 'Esta cuenta no tiene acceso administrativo.'
      });
    }

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'La cuenta no existe.'
      });
    }

    const admin = result.rows[0];

    if (admin.is_blocked) {
      return res.status(403).json({
        message: 'La cuenta está bloqueada.'
      });
    }

    // Verificar el rol REAL en PostgreSQL.
    // No confiar únicamente en el JWT.
    if (String(admin.role).toUpperCase() !== 'ADMIN') {
      return res.status(403).json({
        message: 'No tienes permisos de administrador.'
      });
    }

    req.admin = admin;
    next();

  } catch (error) {
    if (
      error.name === 'TokenExpiredError' ||
      error.name === 'JsonWebTokenError' ||
      error.name === 'NotBeforeError'
    ) {
      return res.status(401).json({
        message: 'Sesión expirada o inválida.'
      });
    }

    console.error('Error verificando administrador:', error);

    return res.status(500).json({
      message: 'No se pudo verificar el administrador.'
    });
  }
};

// Todas las rutas de este archivo requieren ADMIN.
router.use(requireAdmin);

// ==========================================
// ESTADÍSTICAS DEL PANEL
// GET /api/admin/stats
// ==========================================

router.get('/stats', async (req, res) => {
  try {
    const [products, users, orders] = await Promise.all([
      pool.query(
        `
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE stock <= 5)::int AS low_stock
        FROM products
        `
      ),
      pool.query(
        `
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE is_blocked = TRUE)::int
            AS blocked
        FROM users
        `
      ),
      pool.query(
        `
        SELECT COUNT(*)::int AS total
        FROM orders
        `
      )
    ]);

    return res.json({
      products: products.rows[0],
      users: users.rows[0],
      orders: orders.rows[0]
    });

  } catch (error) {
    console.error('Error consultando estadísticas:', error);

    return res.status(500).json({
      message: 'No se pudieron cargar las estadísticas.'
    });
  }
});

// ==========================================
// LISTAR PRODUCTOS
// GET /api/admin/products
// ==========================================

router.get('/products', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, name, description, price, stock, image
      FROM products
      ORDER BY id DESC
      `
    );

    return res.json(result.rows);

  } catch (error) {
    console.error('Error consultando productos:', error);

    return res.status(500).json({
      message: 'No se pudieron consultar los productos.'
    });
  }
});

// ==========================================
// CREAR PRODUCTO
// POST /api/admin/products
// ==========================================

router.post('/products', async (req, res) => {
  try {
    const product = validateProduct(req.body || {});

    const result = await pool.query(
      `
      INSERT INTO products (
        name,
        description,
        price,
        stock,
        image
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        product.name,
        product.description,
        product.price,
        product.stock,
        product.image
      ]
    );

    return res.status(201).json({
      message: 'Producto creado correctamente.',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Error creando producto:', error);

    return res.status(error.status || 500).json({
      message:
        error.status === 400
          ? error.message
          : 'No se pudo crear el producto.'
    });
  }
});

// ==========================================
// EDITAR PRODUCTO
// PUT /api/admin/products/:id
// ==========================================

router.put('/products/:id', async (req, res) => {
  try {
    if (!isPositiveId(req.params.id)) {
      return res.status(400).json({
        message: 'ID del producto inválido.'
      });
    }

    const product = validateProduct(req.body || {});

    const result = await pool.query(
      `
      UPDATE products
      SET
        name = $1,
        description = $2,
        price = $3,
        stock = $4,
        image = $5
      WHERE id = $6
      RETURNING *
      `,
      [
        product.name,
        product.description,
        product.price,
        product.stock,
        product.image,
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Producto no encontrado.'
      });
    }

    return res.json({
      message: 'Producto actualizado correctamente.',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Error actualizando producto:', error);

    return res.status(error.status || 500).json({
      message:
        error.status === 400
          ? error.message
          : 'No se pudo actualizar el producto.'
    });
  }
});

// ==========================================
// ELIMINAR PRODUCTO
// DELETE /api/admin/products/:id
// ==========================================

router.delete('/products/:id', async (req, res) => {
  try {
    if (!isPositiveId(req.params.id)) {
      return res.status(400).json({
        message: 'ID del producto inválido.'
      });
    }

    const result = await pool.query(
      `
      DELETE FROM products
      WHERE id = $1
      RETURNING id, name
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Producto no encontrado.'
      });
    }

    return res.json({
      message: 'Producto eliminado correctamente.',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Error eliminando producto:', error);

    if (error.code === '23503') {
      return res.status(409).json({
        message:
          'Este producto tiene registros relacionados y no puede eliminarse. Se recomienda desactivarlo.'
      });
    }

    return res.status(500).json({
      message: 'No se pudo eliminar el producto.'
    });
  }
});

// ==========================================
// LISTAR USUARIOS
// GET /api/admin/users
// ==========================================

router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, name, email, role, is_blocked
      FROM users
      ORDER BY id DESC
      `
    );

    // Nunca devolver contraseñas o hashes.
    return res.json(result.rows);

  } catch (error) {
    console.error('Error consultando usuarios:', error);

    return res.status(500).json({
      message: 'No se pudieron consultar los usuarios.'
    });
  }
});

// ==========================================
// BLOQUEAR / DESBLOQUEAR USUARIO
// PATCH /api/admin/users/:id/block
// ==========================================

router.patch('/users/:id/block', async (req, res) => {
  try {
    if (!isPositiveId(req.params.id)) {
      return res.status(400).json({
        message: 'ID del usuario inválido.'
      });
    }

    if (typeof req.body?.blocked !== 'boolean') {
      return res.status(400).json({
        message: 'Debes indicar blocked: true o false.'
      });
    }

    if (String(req.admin.id) === String(req.params.id)) {
      return res.status(403).json({
        message: 'No puedes bloquear tu propia cuenta.'
      });
    }

    const result = await pool.query(
      `
      UPDATE users
      SET is_blocked = $1
      WHERE id = $2
        AND UPPER(role) <> 'ADMIN'
      RETURNING id, name, email, role, is_blocked
      `,
      [req.body.blocked, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message:
          'Usuario no encontrado o cuenta administrativa protegida.'
      });
    }

    return res.json({
      message: req.body.blocked
        ? 'Usuario bloqueado correctamente.'
        : 'Usuario desbloqueado correctamente.',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Error cambiando bloqueo:', error);

    return res.status(500).json({
      message: 'No se pudo actualizar el usuario.'
    });
  }
});

// ==========================================
// ELIMINAR USUARIO
// DELETE /api/admin/users/:id
// ==========================================

router.delete('/users/:id', async (req, res) => {
  try {
    if (!isPositiveId(req.params.id)) {
      return res.status(400).json({
        message: 'ID del usuario inválido.'
      });
    }

    if (String(req.admin.id) === String(req.params.id)) {
      return res.status(403).json({
        message: 'No puedes eliminar tu propia cuenta.'
      });
    }

    const result = await pool.query(
      `
      DELETE FROM users
      WHERE id = $1
        AND UPPER(role) <> 'ADMIN'
      RETURNING id, name, email
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message:
          'Usuario no encontrado o cuenta administrativa protegida.'
      });
    }

    return res.json({
      message: 'Usuario eliminado correctamente.',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Error eliminando usuario:', error);

    if (error.code === '23503') {
      return res.status(409).json({
        message:
          'No puede eliminarse el usuario porque tiene información relacionada.'
      });
    }

    return res.status(500).json({
      message: 'No se pudo eliminar el usuario.'
    });
  }
});

module.exports = router;
