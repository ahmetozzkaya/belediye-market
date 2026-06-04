const pool = require('../config/db');

const getMyRestaurant = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM restaurants WHERE owner_id = $1', [req.user.id]);
    if (!result.rows.length) return res.json(null);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const createRestaurant = async (req, res) => {
  const { name, description, address, phone, courier_type = 'own' } = req.body;
  try {
    const existing = await pool.query('SELECT id FROM restaurants WHERE owner_id = $1', [req.user.id]);
    if (existing.rows.length) return res.status(400).json({ message: 'Zaten bir işletmeniz mevcut' });

    const result = await pool.query(
      'INSERT INTO restaurants (municipality_id, owner_id, name, description, address, phone, courier_type, is_active, approval_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [1, req.user.id, name, description, address, phone, courier_type, false, 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const updateRestaurant = async (req, res) => {
  const { name, description, address, phone, courier_type } = req.body;
  try {
    const result = await pool.query(
      'UPDATE restaurants SET name=$1, description=$2, address=$3, phone=$4, courier_type=$5 WHERE owner_id=$6 RETURNING *',
      [name, description, address, phone, courier_type, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'İşletme bulunamadı' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const restaurant = await pool.query('SELECT id FROM restaurants WHERE owner_id = $1', [req.user.id]);
    if (!restaurant.rows.length) return res.json([]);

    const categories = await pool.query(
      `SELECT c.*, json_agg(
        json_build_object('id', i.id, 'name', i.name, 'description', i.description, 'price', i.price, 'is_available', i.is_available)
        ORDER BY i.id
      ) FILTER (WHERE i.id IS NOT NULL) as items
      FROM menu_categories c
      LEFT JOIN menu_items i ON c.id = i.category_id
      WHERE c.restaurant_id = $1
      GROUP BY c.id ORDER BY c.sort_order`,
      [restaurant.rows[0].id]
    );
    res.json(categories.rows);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const createCategory = async (req, res) => {
  const { name } = req.body;
  try {
    const restaurant = await pool.query('SELECT id FROM restaurants WHERE owner_id = $1', [req.user.id]);
    if (!restaurant.rows.length) return res.status(404).json({ message: 'Önce işletme oluşturun' });

    const result = await pool.query(
      'INSERT INTO menu_categories (restaurant_id, name) VALUES ($1, $2) RETURNING *',
      [restaurant.rows[0].id, name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM menu_items WHERE category_id = $1', [id]);
    await pool.query('DELETE FROM menu_categories WHERE id = $1', [id]);
    res.json({ message: 'Kategori silindi' });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const createItem = async (req, res) => {
  const { category_id, name, description, price } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO menu_items (category_id, name, description, price) VALUES ($1,$2,$3,$4) RETURNING *',
      [category_id, name, description, price]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const updateItem = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, is_available } = req.body;
  try {
    const result = await pool.query(
      'UPDATE menu_items SET name=$1, description=$2, price=$3, is_available=$4 WHERE id=$5 RETURNING *',
      [name, description, price, is_available, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const deleteItem = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM menu_items WHERE id = $1', [id]);
    res.json({ message: 'Ürün silindi' });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const getEarnings = async (req, res) => {
  const { period, from, to } = req.query;
  try {
    const restaurant = await pool.query('SELECT id FROM restaurants WHERE owner_id = $1', [req.user.id]);
    if (!restaurant.rows.length) return res.json({ orders: [], totals: { gross: 0, commission: 0, net: 0 } });

    let filter = '';
    if (from && to) {
      filter = `AND o.created_at >= '${from}' AND o.created_at <= '${to}'`;
    } else {
      const periodFilter = {
        '1h':  `AND o.created_at >= NOW() - INTERVAL '1 hour'`,
        '6h':  `AND o.created_at >= NOW() - INTERVAL '6 hours'`,
        '12h': `AND o.created_at >= NOW() - INTERVAL '12 hours'`,
        '24h': `AND o.created_at >= NOW() - INTERVAL '24 hours'`,
        '7d':  `AND o.created_at >= NOW() - INTERVAL '7 days'`,
        '30d': `AND o.created_at >= NOW() - INTERVAL '30 days'`,
        'all': '',
      };
      filter = periodFilter[period] || '';
    }

    const result = await pool.query(`
      SELECT
        o.id as order_id,
        o.created_at,
        o.delivered_at,
        me.gross_amount,
        me.commission,
        me.net_amount,
        json_agg(
          json_build_object('name', oi.name, 'quantity', oi.quantity, 'unit_price', oi.unit_price)
          ORDER BY oi.id
        ) as items
      FROM merchant_earnings me
      JOIN orders o ON me.order_id = o.id
      JOIN order_items oi ON o.id = oi.order_id
      WHERE me.restaurant_id = $1
        AND o.status = 'delivered'
        ${filter}
      GROUP BY o.id, o.created_at, o.delivered_at, me.gross_amount, me.commission, me.net_amount
      ORDER BY o.created_at DESC
    `, [restaurant.rows[0].id]);

    const totals = result.rows.reduce((acc, row) => ({
      gross: acc.gross + parseFloat(row.gross_amount),
      commission: acc.commission + parseFloat(row.commission),
      net: acc.net + parseFloat(row.net_amount),
    }), { gross: 0, commission: 0, net: 0 });

    res.json({ orders: result.rows, totals });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

module.exports = { getMyRestaurant, createRestaurant, updateRestaurant, getCategories, createCategory, deleteCategory, createItem, updateItem, deleteItem, getEarnings };
