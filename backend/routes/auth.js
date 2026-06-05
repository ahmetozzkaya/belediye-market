const router = require('express').Router();
const { register, login, me, updateProfile, changePassword, forgotPassword, resetPassword } = require('../controllers/authController');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/me', auth(), me);
router.put('/profile', auth(), updateProfile);
router.put('/change-password', auth(), changePassword);

module.exports = router;
