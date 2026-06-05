const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { getMunicipalityId } = require('../config/municipality');
require('dotenv').config();

const register = async (req, res) => {
  const { name, email, password, phone, address, role = 'customer' } = req.body;
  try {
    const municipality_id = await getMunicipalityId();
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(400).json({ message: 'Bu email zaten kayıtlı' });

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (municipality_id, name, email, password, phone, address, role) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, name, email, role',
      [municipality_id, name, email, hashed, phone, address, role]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email]);
    if (!result.rows.length) return res.status(400).json({ message: 'Email veya şifre hatalı' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Email veya şifre hatalı' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const me = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, phone, address, role FROM users WHERE id = $1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

const updateProfile = async (req, res) => {
  const { name, phone, address } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET name=$1, phone=$2, address=$3 WHERE id=$4 RETURNING id, name, email, phone, address, role',
      [name, phone, address, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ message: 'Yeni şifre en az 6 karakter olmalıdır' });
  }
  try {
    const result = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const match = await bcrypt.compare(current_password, result.rows[0].password);
    if (!match) return res.status(400).json({ message: 'Mevcut şifre hatalı' });

    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.id]);
    res.json({ message: 'Şifre güncellendi' });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query('SELECT id, name FROM users WHERE email = $1 AND is_active = true', [email]);
    // Her durumda aynı mesajı dön (email numaralandırma saldırısını engeller)
    if (!result.rows.length) return res.json({ message: 'E-posta adresinize şifre sıfırlama bağlantısı gönderildi.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 saat

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [token, expires, result.rows[0].id]
    );

    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
    console.log(`\n[ŞIFRE SIFIRLAMA] Kullanıcı: ${result.rows[0].name} (${email})`);
    console.log(`[ŞIFRE SIFIRLAMA] Bağlantı: ${resetUrl}\n`);

    res.json({ message: 'E-posta adresinize şifre sıfırlama bağlantısı gönderildi.' });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Şifre en az 6 karakter olmalıdır.' });
  }
  try {
    const result = await pool.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );
    if (!result.rows.length) return res.status(400).json({ message: 'Bağlantı geçersiz veya süresi dolmuş.' });

    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashed, result.rows[0].id]
    );
    res.json({ message: 'Şifreniz başarıyla güncellendi.' });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

module.exports = { register, login, me, updateProfile, changePassword, forgotPassword, resetPassword };
