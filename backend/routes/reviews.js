const router = require('express').Router();
const auth = require('../middleware/auth');
const { create, getByRestaurant, getMyRestaurantReviews, getMyReviewedOrders, getAll, toggleVisibility } = require('../controllers/reviewController');

router.post('/', auth(['customer']), create);
router.get('/my-reviewed', auth(['customer']), getMyReviewedOrders);
router.get('/restaurant/:id', getByRestaurant);
router.get('/merchant', auth(['merchant']), getMyRestaurantReviews);
router.get('/admin', auth(['admin']), getAll);
router.patch('/admin/:id/toggle', auth(['admin']), toggleVisibility);

module.exports = router;
