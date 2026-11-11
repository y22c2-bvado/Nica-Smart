const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const createProductsTable = `
  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    price NUMERIC(10,2),
    original_price NUMERIC(10,2),
    stock INTEGER DEFAULT 0,
    image TEXT,
    images TEXT[] DEFAULT '{}',
    description TEXT,
    brand VARCHAR(120),
    brand_url TEXT,
    is_new BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

const createGoogleUsersTable = `
  CREATE TABLE IF NOT EXISTS google_users (
    id BIGSERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(254) NOT NULL,
    name VARCHAR(255),
    picture TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );
`;

const createSocialAccountsTable = `
  CREATE TABLE IF NOT EXISTS social_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
  );
`;

const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

const createPasswordResetTokensTable = `
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_password_reset_user
  ON password_reset_tokens (user_id);
`;

const insertAdminUser = `
  INSERT INTO users (name, email, password, role)
  VALUES ('Admin', 'admin@nica-smart.com', 'admin123', 'admin')
  ON CONFLICT (email) DO NOTHING;
`;

const createOrdersTable = `
  CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(50),
    customer_address TEXT,
    subtotal NUMERIC(10,2) NOT NULL,
    shipping NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

const createOrderItemsTable = `
  CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(200) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    quantity INTEGER NOT NULL
  );
`;


const migrateAddOrderTrackingFields = `
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMPTZ;
`;

const migrateAddOrderPaymentFields = `
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50);
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_card_brand VARCHAR(50);
`;

const createDeliveryConfirmationsTable = `
  CREATE TABLE IF NOT EXISTS delivery_confirmations (
    id BIGSERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    customer_email VARCHAR(255) NOT NULL,
    photo_data BYTEA NOT NULL,
    photo_mime VARCHAR(30) NOT NULL,
    photo_size INTEGER NOT NULL,
    confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_delivery_photo_mime CHECK (photo_mime IN ('image/jpeg', 'image/png', 'image/webp')),
    CONSTRAINT chk_delivery_photo_size CHECK (photo_size > 0 AND photo_size <= 5242880)
  );
`;

const createOrderTrackingIndexes = `
  CREATE INDEX IF NOT EXISTS idx_orders_shipped_at ON orders(shipped_at);
  CREATE INDEX IF NOT EXISTS idx_orders_delivered_at ON orders(delivered_at);
  CREATE INDEX IF NOT EXISTS idx_delivery_confirmations_date ON delivery_confirmations(confirmed_at);
`;

const migrateOrdersStatusConstraint = `
  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
  ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (
      status IN ('pendiente', 'preparando', 'enviado', 'entregado', 'cancelado')
  );
`;

const createAdminTrackingView = `
  CREATE OR REPLACE VIEW v_admin_delivery_tracking AS
  SELECT
      o.id AS order_id,
      o.customer_name,
      o.customer_email,
      o.customer_phone,
      o.customer_address,
      o.total,
      o.status,
      o.created_at AS ordered_at,
      o.shipped_at,
      o.delivered_at,
      o.delivery_confirmed_at,
      CASE WHEN dc.order_id IS NOT NULL THEN TRUE ELSE FALSE END AS has_delivery_photo,
      dc.confirmed_at AS customer_confirmed_at,
      CASE
          WHEN o.delivery_confirmed_at IS NOT NULL THEN 'Confirmado por cliente'
          WHEN LOWER(o.status) IN ('entregado', 'delivered') THEN 'Entregado sin confirmar'
          WHEN LOWER(o.status) IN ('enviado', 'shipped') THEN 'En camino'
          WHEN LOWER(o.status) IN ('preparando', 'processing') THEN 'En preparación'
          WHEN LOWER(o.status) IN ('cancelado', 'cancelled') THEN 'Cancelado'
          ELSE 'Pendiente'
      END AS delivery_summary
  FROM orders o
  LEFT JOIN delivery_confirmations dc ON dc.order_id = o.id;
`;


const insertSeedData = `
  INSERT INTO products (name, category, price, original_price, stock, image, description) VALUES
  ('AirPods 2da Generación', 'Audio', 2490, 2490, 15, '/Imagenes/Airpods2.jpg', 'Audífonos inalámbricos con conexión Bluetooth y estuche de carga.'),
  ('Audífonos Bluetooth Inalámbricos', 'Audio', 1200, 1200, 20, '/Imagenes/audifonosBlu.jpg', 'Audífonos inalámbricos ideales para música, llamadas y uso diario.'),
  ('Cargador Rápido USB-C 35W', 'Cargadores', 850, 850, 25, '/Imagenes/cargador35.jpg', 'Cargador USB-C de carga rápida compatible con múltiples dispositivos.'),
  ('Cargador Rápido USB-C 65W', 'Cargadores', 1450, 1450, 18, '/Imagenes/cargador65.jpg', 'Cargador USB-C de alta potencia para teléfonos, tablets y laptops compatibles.'),
  ('Cable USB-C a USB-C', 'Cables', 350, 350, 40, '/Imagenes/cableAC.jpg', 'Cable USB-C para carga rápida y transferencia de datos.'),
  ('Cable USB-C a Lightning', 'Cables', 450, 450, 35, '/Imagenes/cableC.jpg', 'Cable compatible con dispositivos que utilizan conexión Lightning.'),
  ('Cable HDMI 2.1', 'Cables', 550, 550, 22, '/Imagenes/cableHD.jpg', 'Cable HDMI para transmisión de audio y video en alta resolución.'),
  ('Power Bank 10,000 mAh', 'Energía', 1200, 1200, 17, '/Imagenes/powebank.jpg', 'Batería portátil para cargar dispositivos móviles durante el día.'),
  ('Power Bank 20,000 mAh', 'Energía', 1850, 1850, 12, '/Imagenes/powerbank.jpg', 'Batería portátil de gran capacidad para múltiples cargas.'),
  ('Smartwatch X1', 'Relojes', 3200, 3200, 10, '/Imagenes/smarwatch.jpg', 'Reloj inteligente con conectividad Bluetooth y funciones deportivas.'),
  ('Soporte Ajustable para Laptop', 'Soportes', 950, 950, 14, '/Imagenes/soporte.jpg', 'Soporte ajustable para mejorar la posición y ventilación de la laptop.'),
  ('Soporte Magnético para Celular', 'Soportes', 550, 550, 30, '/Imagenes/soportecelular.jpg', 'Soporte magnético compacto para teléfonos móviles.'),
  ('Mouse Inalámbrico', 'Computación', 520, 650, 28, '/Imagenes/mouse.jpg', 'Mouse inalámbrico para computadora y laptop.'),
  ('Teclado Mecánico RGB', 'Gaming', 1650, 2200, 13, '/Imagenes/teclado.jpg', 'Teclado mecánico con iluminación RGB para gaming y productividad.'),
  ('Hub USB-C Multipuerto', 'Adaptadores', 1450, 1450, 19, '/Imagenes/usbhub.jpg', 'Hub USB-C con múltiples conexiones para distintos dispositivos.'),
  ('Adaptador USB-C a HDMI', 'Adaptadores', 750, 750, 21, '/Imagenes/usbhd.jpg', 'Adaptador para conectar dispositivos USB-C a pantallas HDMI.'),
  ('Webcam Full HD 1080p', 'Computación', 1800, 1800, 16, '/Imagenes/webcam.jpg', 'Cámara web Full HD para videollamadas, clases y reuniones.'),
  ('Bocina Bluetooth Portátil', 'Audio', 1600, 1600, 18, '/Imagenes/bocinablu.jpg', 'Bocina portátil con conexión Bluetooth y batería recargable.'),
  ('Control Inalámbrico para Gaming', 'Gaming', 1615, 1900, 14, '/Imagenes/control.jpg', 'Control inalámbrico para videojuegos y diferentes dispositivos.'),
  ('Base de Carga Inalámbrica', 'Cargadores', 1100, 1100, 24, '/Imagenes/inalambrico.jpg', 'Base de carga inalámbrica para teléfonos compatibles.');
`;

const migrateAddOriginalPrice = `
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2);
`;

const migrateFillOriginalPrice = `
  UPDATE products
  SET original_price = price
  WHERE original_price IS NULL;
`;

const migrateAddCreatedAt = `
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
`;

const migrateAddImagesArray = `
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
`;

const migrateOldImageToImages = `
  UPDATE products
  SET images = ARRAY[image]
  WHERE image IS NOT NULL 
    AND (images IS NULL OR cardinality(images) = 0);
`;

const migrateAddIsNew = `
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_new BOOLEAN NOT NULL DEFAULT FALSE;
`;

const migrateAddBrand = `
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS brand VARCHAR(120);
`;

const migrateAddBrandUrl = `
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS brand_url TEXT;
`;

const createBrandIndex = `
  CREATE INDEX IF NOT EXISTS idx_products_brand ON products (brand);
`;

const createMarkNewFunction = `
  CREATE OR REPLACE FUNCTION marcar_producto_nuevo()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.is_new := TRUE;
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
`;

const createNewProductTrigger = `
  DROP TRIGGER IF EXISTS trigger_producto_nuevo ON products;
  CREATE TRIGGER trigger_producto_nuevo
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION marcar_producto_nuevo();
`;

const applySeasonPromotions = [
  `
  UPDATE products
  SET original_price = 2200, price = 1650
  WHERE name = 'Teclado Mecánico RGB'
    AND price = 2200
  `,
  `
  UPDATE products
  SET original_price = 1900, price = 1615
  WHERE name = 'Control Inalámbrico para Gaming'
    AND price = 1900
  `,
  `
  UPDATE products
  SET original_price = 650, price = 520
  WHERE name = 'Mouse Inalámbrico'
    AND price = 650
  `,
];

const assignBrandsToSeedData = [
  `UPDATE products SET brand = 'Apple', brand_url = 'https://www.apple.com' WHERE name ILIKE '%AirPods%' AND brand IS NULL;`,
  `UPDATE products SET brand = 'Xiaomi', brand_url = 'https://www.mi.com' WHERE name ILIKE '%Audífonos Bluetooth%' AND brand IS NULL;`,
  `UPDATE products SET brand = 'Anker', brand_url = 'https://www.anker.com' WHERE (name ILIKE '%Cargador%' OR name ILIKE '%Power Bank%') AND brand IS NULL;`,
  `UPDATE products SET brand = 'Samsung', brand_url = 'https://www.samsung.com' WHERE name ILIKE '%Smartwatch%' AND brand IS NULL;`,
  `UPDATE products SET brand = 'Logitech', brand_url = 'https://www.logitech.com' WHERE (name ILIKE '%Mouse%' OR name ILIKE '%Teclado%') AND brand IS NULL;`,
  `UPDATE products SET brand = 'Razer', brand_url = 'https://www.razer.com' WHERE name ILIKE '%Control Inalámbrico%' AND brand IS NULL;`,
  `UPDATE products SET brand = 'JBL', brand_url = 'https://www.jbl.com' WHERE name ILIKE '%Bocina%' AND brand IS NULL;`,
  `UPDATE products SET brand = 'MSI', brand_url = 'https://www.msi.com' WHERE name ILIKE '%MSI%' AND brand IS NULL;`
];

async function init() {
  try {
    // 1. TABLAS BASE
    console.log('🔧 Creando tabla products...');
    await pool.query(createProductsTable);
    console.log('✅ Tabla products creada (o ya existía)');

    console.log('🔧 Creando tabla users...');
    await pool.query(createUsersTable);
    console.log('✅ Tabla users creada (o ya existía)');

    console.log('🔧 Creando tabla google_users...');
    await pool.query(createGoogleUsersTable);
    console.log('✅ Tabla google_users creada (o ya existía)');

    // ⚠️ NUEVO: Creación de la tabla para Facebook
    console.log('🔧 Creando tabla social_accounts (Facebook)...');
    await pool.query(createSocialAccountsTable);
    console.log('✅ Tabla social_accounts creada (o ya existía)');

    console.log('🔧 Creando tabla password_reset_tokens...');
    await pool.query(createPasswordResetTokensTable);
    console.log('✅ Tabla password_reset_tokens creada (o ya existía)');

    console.log('👤 Insertando usuario admin...');
    await pool.query(insertAdminUser);
    console.log('✅ Usuario admin listo');

    console.log('🔧 Creando tabla orders...');
    await pool.query(createOrdersTable);
    console.log('✅ Tabla orders creada');

    console.log('🔧 Creando tabla order_items...');
    await pool.query(createOrderItemsTable);
    console.log('✅ Tabla order_items creada');

    // 2. NUEVAS TABLAS Y MIGRACIONES DE PEDIDOS (Sistema de entregas y pagos)
    console.log('🚚 Agregando campos de seguimiento a la tabla orders...');
    await pool.query(migrateAddOrderTrackingFields);
    console.log('✅ Campos shipped_at, delivered_at y delivery_confirmed_at listos');

    console.log('💳 Agregando campos de pago a la tabla orders...');
    await pool.query(migrateAddOrderPaymentFields);
    console.log('✅ Campos de pago listos');

    console.log('📸 Creando tabla delivery_confirmations (Fotos de entrega)...');
    await pool.query(createDeliveryConfirmationsTable);
    console.log('✅ Tabla delivery_confirmations creada');

    console.log('⚡ Creando índices para el seguimiento de pedidos...');
    await pool.query(createOrderTrackingIndexes);
    console.log('✅ Índices de seguimiento listos');

    console.log('🛡️ Actualizando restricciones de estado (CHECK)...');
    await pool.query(migrateOrdersStatusConstraint);
    console.log('✅ Restricción de estados actualizada');

    console.log('👁️ Creando vista administrativa (v_admin_delivery_tracking)...');
    await pool.query(createAdminTrackingView);
    console.log('✅ Vista creada correctamente');

    // 3. MIGRACIONES Y DATOS SEMILLA DE PRODUCTOS
    console.log('🔧 Verificando columna original_price...');
    await pool.query(migrateAddOriginalPrice);
    console.log('✅ Columna original_price lista');

    console.log('🔄 Rellenando original_price en filas existentes...');
    await pool.query(migrateFillOriginalPrice);
    console.log('✅ Filas sin original_price actualizadas');

    console.log('🔧 Verificando columna created_at...');
    await pool.query(migrateAddCreatedAt);
    console.log('✅ Columna created_at lista');

    console.log('🖼️ Verificando columna images (Array)...');
    await pool.query(migrateAddImagesArray);
    console.log('✅ Columna images lista');

    console.log('🔄 Migrando imagen antigua al nuevo array...');
    await pool.query(migrateOldImageToImages);
    console.log('✅ Imágenes migradas');

    console.log('🆕 Verificando columna is_new...');
    await pool.query(migrateAddIsNew);
    console.log('✅ Columna is_new lista');

    console.log('🏷️ Verificando columna brand (Marca)...');
    await pool.query(migrateAddBrand);
    console.log('✅ Columna brand lista');

    console.log('🔗 Verificando columna brand_url (Web de marca)...');
    await pool.query(migrateAddBrandUrl);
    console.log('✅ Columna brand_url lista');

    console.log('⚡ Creando índice para búsquedas por marca...');
    await pool.query(createBrandIndex);
    console.log('✅ Índice de marca listo');

    const { rows } = await pool.query('SELECT COUNT(*) FROM products');

    if (parseInt(rows[0].count) === 0) {
      console.log('📦 Insertando productos...');
      await pool.query(insertSeedData);
      console.log('✅ 20 productos insertados (marcados como NO nuevos)');
    } else {
      console.log(`ℹ️ Ya hay ${rows[0].count} productos, no se insertaron duplicados`);
    }

    console.log('🏷️ Asignando marcas a los productos del catálogo...');
    for (const sql of assignBrandsToSeedData) {
      await pool.query(sql);
    }
    console.log('✅ Marcas asignadas correctamente');

    console.log('🎃 Aplicando promociones de temporada...');
    for (const sql of applySeasonPromotions) {
      await pool.query(sql);
    }
    console.log('✅ Promociones aplicadas');

    console.log('🖥️ Marcando monitor MSI (ID 41) como nuevo si existe...');
    await pool.query(`
      UPDATE products SET is_new = TRUE
      WHERE id = 41 AND name ILIKE '%MSI%'
    `);
    console.log('✅ Verificación de MSI completada');

    // ⚠️ IMPORTANTE: El trigger se crea AL FINAL para no marcar los 20 productos semilla como nuevos
    console.log('⚡ Configurando sistema automático de nuevos ingresos...');
    await pool.query(createMarkNewFunction);
    await pool.query(createNewProductTrigger);
    console.log('✅ Trigger activo: Los productos que agregues desde el Admin serán nuevos');

    // 4. RESUMEN
    const totalProducts = await pool.query('SELECT COUNT(*) FROM products');
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    const withDiscount = await pool.query(
      `SELECT COUNT(*) FROM products
       WHERE original_price IS NOT NULL
         AND original_price > price`
    );
    const newProducts = await pool.query(
      'SELECT COUNT(*) FROM products WHERE is_new = TRUE'
    );
    const productsWithBrand = await pool.query(
      'SELECT COUNT(*) FROM products WHERE brand IS NOT NULL'
    );

    console.log(`📊 Total de productos: ${totalProducts.rows[0].count}`);
    console.log(`📊 Total de usuarios: ${totalUsers.rows[0].count}`);
    console.log(`📊 Productos con descuento activo: ${withDiscount.rows[0].count}`);
    console.log(`📊 Productos marcados como nuevos: ${newProducts.rows[0].count}`);
    console.log(`📊 Productos con marca asignada: ${productsWithBrand.rows[0].count}`);

    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

init();