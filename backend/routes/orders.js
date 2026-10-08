const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.post('/', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      subtotal,
      shipping,
      total,
      items,
    } = req.body;


    if (!customer_name || !customer_email || !items || items.length === 0) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    await client.query('BEGIN');

    const orderResult = await client.query(
      `INSERT INTO orders 
        (customer_name, customer_email, customer_phone, customer_address, subtotal, shipping, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [customer_name, customer_email, customer_phone, customer_address, subtotal, shipping, total]
    );

    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items 
          (order_id, product_id, product_name, price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.product_id, item.product_name, item.price, item.quantity]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Orden creada exitosamente',
      orderId,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creando orden:', err);
    res.status(500).json({ error: 'No se pudo procesar la compra' });
  } finally {
    client.release();
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM orders ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
});

module.exports = router;