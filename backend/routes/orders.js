const router = require('express').Router();
const { create, getMyOrders, getRestaurantOrders, updateStatus, getCourierOrders } = require('../controllers/orderController');
const auth = require('../middleware/auth');

router.post('/', auth(['customer']), create);
router.get('/my', auth(['customer']), getMyOrders);
router.get('/restaurant', auth(['merchant']), getRestaurantOrders);
router.get('/courier', auth(['courier']), getCourierOrders);
router.patch('/:id/status', auth(['merchant', 'courier', 'admin']), updateStatus);

module.exports = router;
