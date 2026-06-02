const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (roles = []) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token bulunamadı' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
      }
      next();
    } catch {
      res.status(401).json({ message: 'Geçersiz token' });
    }
  };
};

module.exports = auth;
