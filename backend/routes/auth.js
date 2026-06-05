const router = require('express').Router();
const { register, login, me, updateProfile, changePassword } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth(), me);
router.put('/profile', auth(), updateProfile);
router.put('/change-password', auth(), changePassword);

module.exports = router;
