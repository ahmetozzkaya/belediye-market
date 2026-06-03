const router = require('express').Router();
const { register, login, me, updateProfile } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth(), me);
router.put('/profile', auth(), updateProfile);

module.exports = router;
