const pool = require('../config/db');

const create = async (req, res) => {
  const { restaurant_id, items, delivery_address, notes } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const restaurant = await client.query('SELECT commission_rate FROM restaurants WHERE id = $1', [restaurant_id]);
    if (!restaurant.rows.length) throw new Error('İşletme bulunamadı');
    const commission_rate = restaurant.rows[0].commission_rate;

    let total_amount = 0;
    for (const item of items) {
      const menuItem = await client.query('SELECT price FROM menu_items WHERE id = $1 AND is_available = true', [item.menu_item_id]);
      if (!menuItem.rows.length) throw new Error(`Ürün bulunamadı: ${item.menu_item_id}`);
      total_amount += menuItem.rows[0].price * item.quantity;
    }

    const order = await client.query(
      'INSERT INTO orders (customer_id, restaurant_id, status, total_amount, commission_rate, delivery_address, notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [req.user.id, restaurant_id, 'pending', total_amount, commission_rate, delivery_address, notes]
    );
    const orderId = order.rows[0].id;

    for (const item of items) {
      const menuItem = await client.query('SELECT name, price FROM menu_items WHERE id = $1', [item.menu_item_id]);
      await client.query(
        'INSERT INTO order_items (order_id, menu_item_id, name, quantity, unit_price) VALUES ($1,$2,$3,$4,$5)',
        [orderId, item.menu_item_id, menuItem.rows[0].name, item.quantity, menuItem.rows[0].price]
      );
    }

    const commission = (total_amount * commission_rate) / 100;
    await client.query(
      'INSERT INTO merchant_earnings (restaurant_id, order_id, gross_amount, commission, net_amount) VALUES ($1,$2,$3,$4,$5)',
      [restaurant_id, orderId, total_amount, commission, total_amount - commission]
    );

    await client.query('COMMIT');

    // Esnafa anlık bildirim: yeni sipariş geldi
    const io = req.app.get('io');
    io.to(`restaurant_${restaurant_id}`).emit('new_order', {
      ...order.rows[0],
      total_amount,
    });

    res.status(201).json(order.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};

const getMyOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, r.name as restaurant_name,
       json_agg(json_build_object('name', oi.name, 'quantity', oi.quantity, 'unit_price', oi.unit_price)) as items
       FROM orders o
       JOIN restaurants r ON o.restaurant_id = r.id
       JOIN order_items oi ON o.id = oi.order_id
       WHERE o.customer_id = $1
       GROUP BY o.id, r.name ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const getRestaurantOrders = async (req, res) => {
  try {
    const restaurant = await pool.query('SELECT id FROM restaurants WHERE owner_id = $1', [req.user.id]);
    if (!restaurant.rows.length) return res.json([]);

    const result = await pool.query(
      `SELECT o.*, u.name as customer_name, u.phone as customer_phone,
       c.name as courier_name,
       json_agg(json_build_object('name', oi.name, 'quantity', oi.quantity, 'unit_price', oi.unit_price)) as items
       FROM orders o
       JOIN users u ON o.customer_id = u.id
       LEFT JOIN users c ON o.courier_id = c.id
       JOIN order_items oi ON o.id = oi.order_id
       WHERE o.restaurant_id = $1
       GROUP BY o.id, u.name, u.phone, c.name ORDER BY o.created_at DESC`,
      [restaurant.rows[0].id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const assignCourier = async (orderId, restaurantId) => {
  // En az aktif teslimata sahip kuryeyi bul
  const result = await pool.query(`
    SELECT u.id, u.name, COUNT(o.id) AS active_count
    FROM users u
    LEFT JOIN orders o ON o.courier_id = u.id AND o.status = 'on_the_way'
    WHERE u.role = 'courier' AND u.is_active = true
    GROUP BY u.id, u.name
    ORDER BY active_count ASC, RANDOM()
    LIMIT 1
  `);
  if (!result.rows.length) return null;

  const courier = result.rows[0];
  await pool.query('UPDATE orders SET courier_id = $1 WHERE id = $2', [courier.id, orderId]);
  return courier;
};

const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Esnaf sadece onaylama/hazırlama adımlarını yapabilir
  const merchantOnlyStatuses = ['confirmed', 'preparing', 'ready', 'cancelled'];
  if (req.user.role === 'merchant' && !merchantOnlyStatuses.includes(status)) {
    return res.status(403).json({ message: 'Bu işlem kurye tarafından yapılmalıdır' });
  }
  // Kurye sadece teslimat adımlarını yapabilir
  const courierOnlyStatuses = ['on_the_way', 'delivered'];
  if (req.user.role === 'courier' && !courierOnlyStatuses.includes(status)) {
    return res.status(403).json({ message: 'Bu işlem esnaf tarafından yapılmalıdır' });
  }

  try {
    const result = await pool.query(
      `UPDATE orders SET status = $1 ${status === 'delivered' ? ', delivered_at = NOW()' : ''} WHERE id = $2 RETURNING *`,
      [status, id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Sipariş bulunamadı' });

    const order = result.rows[0];
    const io = req.app.get('io');

    // Müşteri ve restorana durum güncellemesi gönder
    io.to(`customer_${order.customer_id}`).emit('order_updated', { id: order.id, status });
    io.to(`restaurant_${order.restaurant_id}`).emit('order_updated', { id: order.id, status });

    // Sipariş hazır → kurye otomatik ata
    if (status === 'ready') {
      const courier = await assignCourier(id, order.restaurant_id);
      if (courier) {
        // Atanan kuryeye özel bildirim
        io.to(`courier_${courier.id}`).emit('order_assigned', {
          orderId: order.id,
          courierName: courier.name,
        });
        // Esnafa atama bildir
        io.to(`restaurant_${order.restaurant_id}`).emit('courier_assigned', {
          orderId: order.id,
          courierName: courier.name,
        });
      } else {
        // Müsait kurye yoksa genel havuza düşür
        io.to('couriers').emit('order_ready', { id: order.id });
      }
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const getCourierOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, r.name as restaurant_name, r.address as restaurant_address,
       u.name as customer_name, u.phone as customer_phone
       FROM orders o
       JOIN restaurants r ON o.restaurant_id = r.id
       JOIN users u ON o.customer_id = u.id
       WHERE o.courier_id = $1 OR (o.status = 'ready' AND o.courier_id IS NULL)
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

module.exports = { create, getMyOrders, getRestaurantOrders, updateStatus, getCourierOrders };
