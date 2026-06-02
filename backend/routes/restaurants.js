const router = require('express').Router();
const { getAll, getOne, create, update } = require('../controllers/restaurantController');
const auth = require('../middleware/auth');

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', auth(['merchant', 'admin']), create);
router.put('/:id', auth(['merchant', 'admin']), update);

module.exports = router;
