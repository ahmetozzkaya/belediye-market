const router = require('express').Router();
const { create, getOne, getMyOrders, getRestaurantOrders, updateStatus, getCourierOrders, cancelOrder } = require('../controllers/orderController');
const auth = require('../middleware/auth');

router.post('/', auth(['customer']), create);
router.get('/my', auth(['customer']), getMyOrders);
router.get('/restaurant', auth(['merchant']), getRestaurantOrders);
router.get('/courier', auth(['courier']), getCourierOrders);
router.get('/:id', auth(), getOne);
router.patch('/:id/status', auth(['merchant', 'courier', 'admin']), updateStatus);
router.patch('/:id/cancel', auth(['customer']), cancelOrder);

module.exports = router;
