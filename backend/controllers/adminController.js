const pool = require('../config/db');

const getStats = async (req, res) => {
  try {
    const [users, restaurants, orders, earnings, pending] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query("SELECT COUNT(*) FROM restaurants WHERE approval_status = 'approved'"),
      pool.query("SELECT COUNT(*), SUM(total_amount) FROM orders WHERE status = 'delivered'"),
      pool.query('SELECT SUM(commission) as total_commission FROM merchant_earnings'),
      pool.query("SELECT COUNT(*) FROM restaurants WHERE approval_status = 'pending'"),
    ]);
    res.json({
      total_users: parseInt(users.rows[0].count),
      total_restaurants: parseInt(restaurants.rows[0].count),
      total_orders: parseInt(orders.rows[0].count),
      total_revenue: parseFloat(orders.rows[0].sum) || 0,
      total_commission: parseFloat(earnings.rows[0].total_commission) || 0,
      pending_restaurants: parseInt(pending.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, phone, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const toggleUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, name, is_active',
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const getMunicipality = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM municipalities WHERE id = 1');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const updateMunicipality = async (req, res) => {
  const { name, logo_url, primary_color, secondary_color } = req.body;
  try {
    const result = await pool.query(
      'UPDATE municipalities SET name=$1, logo_url=$2, primary_color=$3, secondary_color=$4 WHERE id=1 RETURNING *',
      [name, logo_url, primary_color, secondary_color]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

// İşletme yönetimi
const getRestaurants = async (req, res) => {
  const { status = 'all' } = req.query;
  try {
    const where = status === 'all' ? '' : `WHERE r.approval_status = '${status}'`;
    const result = await pool.query(`
      SELECT r.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone,
        (SELECT COUNT(*) FROM orders o WHERE o.restaurant_id = r.id AND o.status = 'delivered') as total_orders
      FROM restaurants r
      JOIN users u ON r.owner_id = u.id
      ${where}
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const approveRestaurant = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE restaurants SET approval_status = 'approved', is_active = true WHERE id = $1 RETURNING *",
      [id]
    );
    const restaurant = result.rows[0];
    const io = req.app.get('io');
    io.to(`customer_${restaurant.owner_id}`).emit('restaurant_approved', {
      restaurantName: restaurant.name,
    });
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const rejectRestaurant = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE restaurants SET approval_status = 'rejected', is_active = false WHERE id = $1 RETURNING *",
      [id]
    );
    const io = req.app.get('io');
    io.to(`customer_${result.rows[0].owner_id}`).emit('restaurant_rejected', {
      restaurantName: result.rows[0].name,
    });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const toggleRestaurant = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE restaurants SET is_active = NOT is_active WHERE id = $1 RETURNING id, name, is_active',
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

// Komisyon raporu
const getCommissionReport = async (req, res) => {
  const { period = '30d' } = req.query;
  const periodFilter = {
    '7d':  `AND o.created_at >= NOW() - INTERVAL '7 days'`,
    '30d': `AND o.created_at >= NOW() - INTERVAL '30 days'`,
    '90d': `AND o.created_at >= NOW() - INTERVAL '90 days'`,
    'all': '',
  };
  const filter = periodFilter[period] || '';
  try {
    const result = await pool.query(`
      SELECT
        r.id, r.name as restaurant_name,
        COUNT(o.id) as order_count,
        SUM(me.gross_amount) as gross_total,
        SUM(me.commission) as commission_total,
        SUM(me.net_amount) as net_total
      FROM restaurants r
      LEFT JOIN merchant_earnings me ON me.restaurant_id = r.id
      LEFT JOIN orders o ON me.order_id = o.id AND o.status = 'delivered' ${filter}
      WHERE r.approval_status = 'approved'
      GROUP BY r.id, r.name
      ORDER BY commission_total DESC NULLS LAST
    `);

    const totals = result.rows.reduce((acc, r) => ({
      orders: acc.orders + parseInt(r.order_count || 0),
      gross: acc.gross + parseFloat(r.gross_total || 0),
      commission: acc.commission + parseFloat(r.commission_total || 0),
      net: acc.net + parseFloat(r.net_total || 0),
    }), { orders: 0, gross: 0, commission: 0, net: 0 });

    res.json({ restaurants: result.rows, totals });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

// Kurye yönetimi
const getCouriers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id, u.name, u.email, u.phone, u.is_active, u.created_at,
        COUNT(o.id) FILTER (WHERE o.status = 'delivered') as completed_deliveries,
        COUNT(o.id) FILTER (WHERE o.status = 'on_the_way') as active_deliveries
      FROM users u
      LEFT JOIN orders o ON o.courier_id = u.id
      WHERE u.role = 'courier'
      GROUP BY u.id
      ORDER BY completed_deliveries DESC NULLS LAST
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

module.exports = {
  getStats, getUsers, toggleUser, getMunicipality, updateMunicipality,
  getRestaurants, approveRestaurant, rejectRestaurant, toggleRestaurant,
  getCommissionReport, getCouriers,
};
