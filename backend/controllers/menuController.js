const pool = require('../config/db');
const { getMunicipalityId } = require('../config/municipality');

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
    const municipality_id = await getMunicipalityId();
    const existing = await pool.query('SELECT id FROM restaurants WHERE owner_id = $1', [req.user.id]);
    if (existing.rows.length) return res.status(400).json({ message: 'Zaten bir işletmeniz mevcut' });

    const { categories = [] } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        'INSERT INTO restaurants (municipality_id, owner_id, name, description, address, phone, courier_type, categories, is_active, approval_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
        [municipality_id, req.user.id, name, description, address, phone, courier_type, categories, false, 'pending']
      );
      const restaurantId = result.rows[0].id;

      // Varsayılan çalışma saatleri: Pzt-Cmt 09:00-22:00, Pazar 10:00-21:00
      for (let day = 0; day <= 6; day++) {
        const openTime = day === 0 ? '10:00' : '09:00';
        const closeTime = day === 0 ? '21:00' : '22:00';
        await client.query(
          'INSERT INTO restaurant_hours (restaurant_id, day_of_week, open_time, close_time) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
          [restaurantId, day, openTime, closeTime]
        );
      }

      await client.query('COMMIT');
      res.status(201).json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const updateRestaurant = async (req, res) => {
  const { name, description, address, phone, courier_type, categories = [] } = req.body;
  try {
    const result = await pool.query(
      'UPDATE restaurants SET name=$1, description=$2, address=$3, phone=$4, courier_type=$5, categories=$6 WHERE owner_id=$7 RETURNING *',
      [name, description, address, phone, courier_type, categories, req.user.id]
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

const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const restaurant = await pool.query('SELECT id FROM restaurants WHERE owner_id = $1', [req.user.id]);
    if (!restaurant.rows.length) return res.status(403).json({ message: 'Yetkiniz yok' });

    const result = await pool.query(
      'UPDATE menu_categories SET name = $1 WHERE id = $2 AND restaurant_id = $3 RETURNING *',
      [name, id, restaurant.rows[0].id]
    );
    if (!result.rows.length) return res.status(403).json({ message: 'Bu kategoriye erişim yetkiniz yok' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const restaurant = await pool.query('SELECT id FROM restaurants WHERE owner_id = $1', [req.user.id]);
    if (!restaurant.rows.length) return res.status(403).json({ message: 'Yetkiniz yok' });

    const category = await pool.query(
      'SELECT id FROM menu_categories WHERE id = $1 AND restaurant_id = $2',
      [id, restaurant.rows[0].id]
    );
    if (!category.rows.length) return res.status(403).json({ message: 'Bu kategoriye erişim yetkiniz yok' });

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
    const restaurant = await pool.query('SELECT id FROM restaurants WHERE owner_id = $1', [req.user.id]);
    if (!restaurant.rows.length) return res.status(403).json({ message: 'Yetkiniz yok' });

    const category = await pool.query(
      'SELECT id FROM menu_categories WHERE id = $1 AND restaurant_id = $2',
      [category_id, restaurant.rows[0].id]
    );
    if (!category.rows.length) return res.status(403).json({ message: 'Bu kategoriye erişim yetkiniz yok' });

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
    const restaurant = await pool.query('SELECT id FROM restaurants WHERE owner_id = $1', [req.user.id]);
    if (!restaurant.rows.length) return res.status(403).json({ message: 'Yetkiniz yok' });

    const item = await pool.query(
      'SELECT i.id FROM menu_items i JOIN menu_categories c ON i.category_id = c.id WHERE i.id = $1 AND c.restaurant_id = $2',
      [id, restaurant.rows[0].id]
    );
    if (!item.rows.length) return res.status(403).json({ message: 'Bu ürüne erişim yetkiniz yok' });

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
    const restaurant = await pool.query('SELECT id FROM restaurants WHERE owner_id = $1', [req.user.id]);
    if (!restaurant.rows.length) return res.status(403).json({ message: 'Yetkiniz yok' });

    const item = await pool.query(
      'SELECT i.id FROM menu_items i JOIN menu_categories c ON i.category_id = c.id WHERE i.id = $1 AND c.restaurant_id = $2',
      [id, restaurant.rows[0].id]
    );
    if (!item.rows.length) return res.status(403).json({ message: 'Bu ürüne erişim yetkiniz yok' });

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

    let filterClause = '';
    const params = [restaurant.rows[0].id];

    if (from && to) {
      params.push(from, to);
      filterClause = `AND o.created_at >= $${params.length - 1} AND o.created_at <= $${params.length}`;
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
      filterClause = periodFilter[period] || '';
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
        ${filterClause}
      GROUP BY o.id, o.created_at, o.delivered_at, me.gross_amount, me.commission, me.net_amount
      ORDER BY o.created_at DESC
    `, params);

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

const getHours = async (req, res) => {
  try {
    const restaurant = await pool.query('SELECT id FROM restaurants WHERE owner_id = $1', [req.user.id]);
    if (!restaurant.rows.length) return res.status(404).json({ message: 'İşletme bulunamadı' });

    const result = await pool.query(
      'SELECT * FROM restaurant_hours WHERE restaurant_id = $1 ORDER BY day_of_week',
      [restaurant.rows[0].id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const updateHours = async (req, res) => {
  const { hours } = req.body; // array of { day_of_week, open_time, close_time, is_closed }
  try {
    const restaurant = await pool.query('SELECT id FROM restaurants WHERE owner_id = $1', [req.user.id]);
    if (!restaurant.rows.length) return res.status(404).json({ message: 'İşletme bulunamadı' });

    const restaurantId = restaurant.rows[0].id;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const h of hours) {
        await client.query(
          `INSERT INTO restaurant_hours (restaurant_id, day_of_week, open_time, close_time, is_closed)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (restaurant_id, day_of_week)
           DO UPDATE SET open_time = $3, close_time = $4, is_closed = $5`,
          [restaurantId, h.day_of_week, h.open_time, h.close_time, h.is_closed]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    const result = await pool.query(
      'SELECT * FROM restaurant_hours WHERE restaurant_id = $1 ORDER BY day_of_week',
      [restaurantId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

module.exports = { getMyRestaurant, createRestaurant, updateRestaurant, getCategories, createCategory, updateCategory, deleteCategory, createItem, updateItem, deleteItem, getEarnings, getHours, updateHours };
