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
  const { limit = 10, offset = 0 } = req.query;
  try {
    const [ordersResult, countResult] = await Promise.all([
      pool.query(
        `SELECT o.*, r.name as restaurant_name,
         json_agg(json_build_object('name', oi.name, 'quantity', oi.quantity, 'unit_price', oi.unit_price)) as items
         FROM orders o
         JOIN restaurants r ON o.restaurant_id = r.id
         JOIN order_items oi ON o.id = oi.order_id
         WHERE o.customer_id = $1
         GROUP BY o.id, r.name ORDER BY o.created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      ),
      pool.query('SELECT COUNT(*) FROM orders WHERE customer_id = $1', [req.user.id]),
    ]);
    res.json({ orders: ordersResult.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'on_the_way'];
const COMPLETED_STATUSES = ['delivered', 'cancelled'];

const getRestaurantOrders = async (req, res) => {
  const { status_group, limit = 20, offset = 0 } = req.query;
  try {
    const restaurant = await pool.query('SELECT id FROM restaurants WHERE owner_id = $1', [req.user.id]);
    if (!restaurant.rows.length) return res.json({ orders: [], total: 0 });

    const restaurantId = restaurant.rows[0].id;
    const statuses = status_group === 'active' ? ACTIVE_STATUSES : status_group === 'completed' ? COMPLETED_STATUSES : null;
    const whereStatus = statuses ? `AND o.status = ANY($2::text[])` : '';
    const params = statuses ? [restaurantId, statuses] : [restaurantId];

    const [ordersResult, countResult] = await Promise.all([
      pool.query(
        `SELECT o.*, u.name as customer_name, u.phone as customer_phone,
         c.name as courier_name, c.phone as courier_phone,
         json_agg(json_build_object('name', oi.name, 'quantity', oi.quantity, 'unit_price', oi.unit_price)) as items
         FROM orders o
         JOIN users u ON o.customer_id = u.id
         LEFT JOIN users c ON o.courier_id = c.id
         JOIN order_items oi ON o.id = oi.order_id
         WHERE o.restaurant_id = $1 ${whereStatus}
         GROUP BY o.id, u.name, u.phone, c.name, c.phone ORDER BY o.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*) FROM orders o WHERE o.restaurant_id = $1 ${whereStatus}`,
        params
      ),
    ]);
    res.json({ orders: ordersResult.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const assignCourier = async (orderId, restaurantId) => {
  const restaurant = await pool.query(
    'SELECT courier_type, municipality_id FROM restaurants WHERE id = $1',
    [restaurantId]
  );
  if (!restaurant.rows.length) return null;
  // Kendi kuryesi olan restoranlar için platform kurye atanmaz
  if (!['municipality', 'both'].includes(restaurant.rows[0].courier_type)) return null;

  const { municipality_id } = restaurant.rows[0];
  const result = await pool.query(`
    SELECT u.id, u.name, COUNT(o.id) AS active_count
    FROM users u
    LEFT JOIN orders o ON o.courier_id = u.id AND o.status = 'on_the_way'
    WHERE u.role = 'courier' AND u.is_active = true AND u.municipality_id = $1
    GROUP BY u.id, u.name
    ORDER BY active_count ASC, RANDOM()
    LIMIT 1
  `, [municipality_id]);
  if (!result.rows.length) return null;

  const courier = result.rows[0];
  await pool.query('UPDATE orders SET courier_id = $1 WHERE id = $2', [courier.id, orderId]);
  return courier;
};

const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const merchantOnlyStatuses = ['confirmed', 'preparing', 'ready', 'cancelled'];
  const courierOnlyStatuses = ['on_the_way', 'delivered'];

  if (req.user.role === 'merchant' && !merchantOnlyStatuses.includes(status)) {
    return res.status(403).json({ message: 'Bu işlem kurye tarafından yapılmalıdır' });
  }
  if (req.user.role === 'courier' && !courierOnlyStatuses.includes(status)) {
    return res.status(403).json({ message: 'Bu işlem esnaf tarafından yapılmalıdır' });
  }

  try {
    // Sahiplik kontrolü: esnaf kendi restoranının, kurye kendi atandığı siparişin durumunu değiştirebilir
    const orderCheck = await pool.query(
      `SELECT o.*, r.owner_id FROM orders o JOIN restaurants r ON o.restaurant_id = r.id WHERE o.id = $1`,
      [id]
    );
    if (!orderCheck.rows.length) return res.status(404).json({ message: 'Sipariş bulunamadı' });

    const existing = orderCheck.rows[0];
    if (req.user.role === 'merchant' && existing.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Bu siparişe erişim yetkiniz yok' });
    }
    if (req.user.role === 'courier' && existing.courier_id !== req.user.id) {
      return res.status(403).json({ message: 'Bu sipariş size atanmamış' });
    }

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
  const { status_group, limit = 20, offset = 0 } = req.query;
  try {
    const courier = await pool.query('SELECT municipality_id FROM users WHERE id = $1', [req.user.id]);
    const municipality_id = courier.rows[0]?.municipality_id;

    const baseWhere = `(o.courier_id = $1 OR (o.status = 'ready' AND o.courier_id IS NULL AND r.courier_type IN ('municipality', 'both') AND r.municipality_id = $2))`;
    const statuses = status_group === 'active' ? ACTIVE_STATUSES : status_group === 'completed' ? COMPLETED_STATUSES : null;
    const statusFilter = statuses ? `AND o.status = ANY($3::text[])` : '';
    const baseParams = [req.user.id, municipality_id];
    const params = statuses ? [...baseParams, statuses] : baseParams;

    const [ordersResult, countResult] = await Promise.all([
      pool.query(
        `SELECT o.*, r.name as restaurant_name, r.address as restaurant_address, r.phone as restaurant_phone,
         u.name as customer_name, u.phone as customer_phone
         FROM orders o
         JOIN restaurants r ON o.restaurant_id = r.id
         JOIN users u ON o.customer_id = u.id
         WHERE ${baseWhere} ${statusFilter}
         ORDER BY o.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*) FROM orders o
         JOIN restaurants r ON o.restaurant_id = r.id
         WHERE ${baseWhere} ${statusFilter}`,
        params
      ),
    ]);
    res.json({ orders: ordersResult.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const getOne = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT o.*, r.name as restaurant_name, r.address as restaurant_address,
       u.name as customer_name, u.phone as customer_phone,
       c.name as courier_name, c.phone as courier_phone,
       json_agg(json_build_object('name', oi.name, 'quantity', oi.quantity, 'unit_price', oi.unit_price) ORDER BY oi.id) as items
       FROM orders o
       JOIN restaurants r ON o.restaurant_id = r.id
       JOIN users u ON o.customer_id = u.id
       LEFT JOIN users c ON o.courier_id = c.id
       JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = $1
       GROUP BY o.id, r.name, r.address, u.name, u.phone, c.name, c.phone`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Sipariş bulunamadı' });

    const order = result.rows[0];
    const { role, id: userId } = req.user;
    if (role === 'customer' && order.customer_id !== userId) {
      return res.status(403).json({ message: 'Bu siparişe erişim yetkiniz yok' });
    }
    if (role === 'courier' && order.courier_id !== userId) {
      return res.status(403).json({ message: 'Bu siparişe erişim yetkiniz yok' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const cancelOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND customer_id = $2',
      [id, req.user.id]
    );
    if (!order.rows.length) return res.status(404).json({ message: 'Sipariş bulunamadı' });
    if (!['pending', 'confirmed'].includes(order.rows[0].status)) {
      return res.status(400).json({ message: 'Bu sipariş artık iptal edilemez' });
    }

    const result = await pool.query(
      "UPDATE orders SET status = 'cancelled' WHERE id = $1 RETURNING *",
      [id]
    );
    const io = req.app.get('io');
    io.to(`restaurant_${result.rows[0].restaurant_id}`).emit('order_updated', { id: result.rows[0].id, status: 'cancelled' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

module.exports = { create, getOne, getMyOrders, getRestaurantOrders, updateStatus, getCourierOrders, cancelOrder };
