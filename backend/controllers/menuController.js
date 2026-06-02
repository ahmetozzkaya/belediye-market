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
      'INSERT INTO restaurants (municipality_id, owner_id, name, description, address, phone, courier_type) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [1, req.user.id, name, description, address, phone, courier_type]
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

module.exports = { getMyRestaurant, createRestaurant, updateRestaurant, getCategories, createCategory, deleteCategory, createItem, updateItem, deleteItem };
