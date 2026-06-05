const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 10,
  message: { message: 'Çok fazla deneme yapıldı. 2 dakika sonra tekrar deneyin.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: 'İstek limiti aşıldı. Lütfen bekleyin.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, apiLimiter };
