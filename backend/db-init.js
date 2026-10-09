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
    stock INTEGER DEFAULT 0,
    image TEXT,
    description TEXT,
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

const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
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

const insertSeedData = `
  INSERT INTO products (name, category, price, stock, image, description) VALUES
  ('AirPods 2da Generación', 'Audio', 2490, 15, '/Imagenes/Airpods2.jpg', 'Audífonos inalámbricos con conexión Bluetooth y estuche de carga.'),
  ('Audífonos Bluetooth Inalámbricos', 'Audio', 1200, 20, '/Imagenes/audifonosBlu.jpg', 'Audífonos inalámbricos ideales para música, llamadas y uso diario.'),
  ('Cargador Rápido USB-C 35W', 'Cargadores', 850, 25, '/Imagenes/cargador35.jpg', 'Cargador USB-C de carga rápida compatible con múltiples dispositivos.'),
  ('Cargador Rápido USB-C 65W', 'Cargadores', 1450, 18, '/Imagenes/cargador65.jpg', 'Cargador USB-C de alta potencia para teléfonos, tablets y laptops compatibles.'),
  ('Cable USB-C a USB-C', 'Cables', 350, 40, '/Imagenes/cableAC.jpg', 'Cable USB-C para carga rápida y transferencia de datos.'),
  ('Cable USB-C a Lightning', 'Cables', 450, 35, '/Imagenes/cableC.jpg', 'Cable compatible con dispositivos que utilizan conexión Lightning.'),
  ('Cable HDMI 2.1', 'Cables', 550, 22, '/Imagenes/cableHD.jpg', 'Cable HDMI para transmisión de audio y video en alta resolución.'),
  ('Power Bank 10,000 mAh', 'Energía', 1200, 17, '/Imagenes/powebank.jpg', 'Batería portátil para cargar dispositivos móviles durante el día.'),
  ('Power Bank 20,000 mAh', 'Energía', 1850, 12, '/Imagenes/powerbank.jpg', 'Batería portátil de gran capacidad para múltiples cargas.'),
  ('Smartwatch X1', 'Relojes', 3200, 10, '/Imagenes/smarwatch.jpg', 'Reloj inteligente con conectividad Bluetooth y funciones deportivas.'),
  ('Soporte Ajustable para Laptop', 'Soportes', 950, 14, '/Imagenes/soporte.jpg', 'Soporte ajustable para mejorar la posición y ventilación de la laptop.'),
  ('Soporte Magnético para Celular', 'Soportes', 550, 30, '/Imagenes/soportecelular.jpg', 'Soporte magnético compacto para teléfonos móviles.'),
  ('Mouse Inalámbrico', 'Computación', 650, 28, '/Imagenes/mouse.jpg', 'Mouse inalámbrico para computadora y laptop.'),
  ('Teclado Mecánico RGB', 'Gaming', 2200, 13, '/Imagenes/teclado.jpg', 'Teclado mecánico con iluminación RGB para gaming y productividad.'),
  ('Hub USB-C Multipuerto', 'Adaptadores', 1450, 19, '/Imagenes/usbhub.jpg', 'Hub USB-C con múltiples conexiones para distintos dispositivos.'),
  ('Adaptador USB-C a HDMI', 'Adaptadores', 750, 21, '/Imagenes/usbhd.jpg', 'Adaptador para conectar dispositivos USB-C a pantallas HDMI.'),
  ('Webcam Full HD 1080p', 'Computación', 1800, 16, '/Imagenes/webcam.jpg', 'Cámara web Full HD para videollamadas, clases y reuniones.'),
  ('Bocina Bluetooth Portátil', 'Audio', 1600, 18, '/Imagenes/bocinablu.jpg', 'Bocina portátil con conexión Bluetooth y batería recargable.'),
  ('Control Inalámbrico para Gaming', 'Gaming', 1900, 14, '/Imagenes/control.jpg', 'Control inalámbrico para videojuegos y diferentes dispositivos.'),
  ('Base de Carga Inalámbrica', 'Cargadores', 1100, 24, '/Imagenes/inalambrico.jpg', 'Base de carga inalámbrica para teléfonos compatibles.');
`;


async function init() {
  try {
    console.log('🔧 Creando tabla products...');
    await pool.query(createProductsTable);
    console.log('✅ Tabla products creada (o ya existía)');

    console.log('🔧 Creando tabla users...');
    await pool.query(createUsersTable);
    console.log('✅ Tabla users creada (o ya existía)');

    // NUEVO: TABLA PARA INICIO DE SESIÓN CON GOOGLE
    console.log('🔧 Creando tabla google_users...');
    await pool.query(createGoogleUsersTable);
    console.log('✅ Tabla google_users creada (o ya existía)');

    console.log('👤 Insertando usuario admin...');
    await pool.query(insertAdminUser);
    console.log('✅ Usuario admin listo');

    console.log('🔧 Creando tabla orders...');
    await pool.query(createOrdersTable);
    console.log('✅ Tabla orders creada');

    console.log('🔧 Creando tabla order_items...');
    await pool.query(createOrderItemsTable);
    console.log('✅ Tabla order_items creada');

    const { rows } = await pool.query(
      'SELECT COUNT(*) FROM products'
    );

    if (parseInt(rows[0].count) === 0) {
      console.log('📦 Insertando productos...');
      await pool.query(insertSeedData);
      console.log('✅ 20 productos insertados');
    } else {
      console.log(
        `ℹ️ Ya hay ${rows[0].count} productos, no se insertaron duplicados`
      );
    }

    const totalProducts = await pool.query(
      'SELECT COUNT(*) FROM products'
    );
    const totalUsers = await pool.query(
      'SELECT COUNT(*) FROM users'
    );

    console.log(`📊 Total de productos: ${totalProducts.rows[0].count}`);
    console.log(`📊 Total de usuarios: ${totalUsers.rows[0].count}`);

    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}


init();