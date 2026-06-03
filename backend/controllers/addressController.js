const pool = require('../config/db');

const getAll = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

const create = async (req, res) => {
  const { title, address, is_default = false } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (is_default) {
      await client.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
    }
    const result = await client.query(
      'INSERT INTO addresses (user_id, title, address, is_default) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.user.id, title, address, is_default]
    );
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Sunucu hatası' });
  } finally {
    client.release();
  }
};

const setDefault = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
    const result = await client.query(
      'UPDATE addresses SET is_default = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );
    await client.query('COMMIT');
    if (!result.rows.length) return res.status(404).json({ message: 'Adres bulunamadı' });
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Sunucu hatası' });
  } finally {
    client.release();
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const { title, address } = req.body;
  try {
    const result = await pool.query(
      'UPDATE addresses SET title=$1, address=$2 WHERE id=$3 AND user_id=$4 RETURNING *',
      [title, address, id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Adres bulunamadı' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

const remove = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    res.json({ message: 'Adres silindi' });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

module.exports = { getAll, create, update, setDefault, remove };
