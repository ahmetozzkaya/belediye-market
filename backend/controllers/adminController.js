const pool = require('../config/db');

const getStats = async (req, res) => {
  try {
    const [users, restaurants, orders, earnings] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM restaurants'),
      pool.query('SELECT COUNT(*), SUM(total_amount) FROM orders WHERE status = $1', ['delivered']),
      pool.query('SELECT SUM(commission) as total_commission FROM merchant_earnings'),
    ]);
    res.json({
      total_users: parseInt(users.rows[0].count),
      total_restaurants: parseInt(restaurants.rows[0].count),
      total_orders: parseInt(orders.rows[0].count),
      total_revenue: parseFloat(orders.rows[0].sum) || 0,
      total_commission: parseFloat(earnings.rows[0].total_commission) || 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, phone, is_active, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const toggleUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, name, is_active', [id]);
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

module.exports = { getStats, getUsers, toggleUser, getMunicipality, updateMunicipality };
