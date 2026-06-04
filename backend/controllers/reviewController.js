const pool = require('../config/db');

const create = async (req, res) => {
  const { order_id, rating, comment } = req.body;
  try {
    const order = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND customer_id = $2 AND status = $3',
      [order_id, req.user.id, 'delivered']
    );
    if (!order.rows.length) return res.status(400).json({ message: 'Bu sipariş için değerlendirme yapılamaz' });

    const existing = await pool.query('SELECT id FROM reviews WHERE order_id = $1', [order_id]);
    if (existing.rows.length) return res.status(400).json({ message: 'Bu sipariş zaten değerlendirildi' });

    const result = await pool.query(
      'INSERT INTO reviews (order_id, customer_id, restaurant_id, rating, comment) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [order_id, req.user.id, order.rows[0].restaurant_id, rating, comment]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const getByRestaurant = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT r.*, u.name as customer_name
       FROM reviews r
       JOIN users u ON r.customer_id = u.id
       WHERE r.restaurant_id = $1 AND r.is_visible = true
       ORDER BY r.created_at DESC`,
      [id]
    );
    const avg = result.rows.length
      ? (result.rows.reduce((s, r) => s + r.rating, 0) / result.rows.length).toFixed(1)
      : null;
    res.json({ reviews: result.rows, average: avg, count: result.rows.length });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const getMyRestaurantReviews = async (req, res) => {
  try {
    const restaurant = await pool.query('SELECT id FROM restaurants WHERE owner_id = $1', [req.user.id]);
    if (!restaurant.rows.length) return res.json({ reviews: [], average: null, count: 0 });

    const result = await pool.query(
      `SELECT r.*, u.name as customer_name, o.created_at as order_date
       FROM reviews r
       JOIN users u ON r.customer_id = u.id
       JOIN orders o ON r.order_id = o.id
       WHERE r.restaurant_id = $1
       ORDER BY r.created_at DESC`,
      [restaurant.rows[0].id]
    );
    const avg = result.rows.length
      ? (result.rows.reduce((s, r) => s + r.rating, 0) / result.rows.length).toFixed(1)
      : null;
    res.json({ reviews: result.rows, average: avg, count: result.rows.length });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

// Müşterinin hangi siparişlerini değerlendirdiğini döndür
const getMyReviewedOrders = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT order_id FROM reviews WHERE customer_id = $1',
      [req.user.id]
    );
    res.json(result.rows.map(r => r.order_id));
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Admin: tüm değerlendirmeler
const getAll = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.name as customer_name, rest.name as restaurant_name
       FROM reviews r
       JOIN users u ON r.customer_id = u.id
       JOIN restaurants rest ON r.restaurant_id = rest.id
       ORDER BY r.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Admin: görünürlük toggle
const toggleVisibility = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE reviews SET is_visible = NOT is_visible WHERE id = $1 RETURNING *',
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

module.exports = { create, getByRestaurant, getMyRestaurantReviews, getMyReviewedOrders, getAll, toggleVisibility };
