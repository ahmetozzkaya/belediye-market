const pool = require('../config/db');

const getAll = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT r.*, u.name as owner_name FROM restaurants r JOIN users u ON r.owner_id = u.id WHERE r.is_active = true ORDER BY r.name'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await pool.query('SELECT * FROM restaurants WHERE id = $1', [id]);
    if (!restaurant.rows.length) return res.status(404).json({ message: 'İşletme bulunamadı' });

    const categories = await pool.query(
      'SELECT c.*, json_agg(json_build_object(\'id\', i.id, \'name\', i.name, \'description\', i.description, \'price\', i.price, \'image_url\', i.image_url, \'is_available\', i.is_available) ORDER BY i.id) as items FROM menu_categories c LEFT JOIN menu_items i ON c.id = i.category_id WHERE c.restaurant_id = $1 GROUP BY c.id ORDER BY c.sort_order',
      [id]
    );
    res.json({ ...restaurant.rows[0], menu: categories.rows });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const create = async (req, res) => {
  const { name, description, address, phone, courier_type, commission_rate, municipality_id = 1 } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO restaurants (municipality_id, owner_id, name, description, address, phone, courier_type, commission_rate) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [municipality_id, req.user.id, name, description, address, phone, courier_type, commission_rate]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const { name, description, address, phone, courier_type, is_active } = req.body;
  try {
    const result = await pool.query(
      'UPDATE restaurants SET name=$1, description=$2, address=$3, phone=$4, courier_type=$5, is_active=$6 WHERE id=$7 AND owner_id=$8 RETURNING *',
      [name, description, address, phone, courier_type, is_active, id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'İşletme bulunamadı veya yetkiniz yok' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

module.exports = { getAll, getOne, create, update };
