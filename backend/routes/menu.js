const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  getMyRestaurant, createRestaurant, updateRestaurant,
  getCategories, createCategory, deleteCategory,
  createItem, updateItem, deleteItem
} = require('../controllers/menuController');

router.get('/restaurant', auth(['merchant']), getMyRestaurant);
router.post('/restaurant', auth(['merchant']), createRestaurant);
router.put('/restaurant', auth(['merchant']), updateRestaurant);

router.get('/categories', auth(['merchant']), getCategories);
router.post('/categories', auth(['merchant']), createCategory);
router.delete('/categories/:id', auth(['merchant']), deleteCategory);

router.post('/items', auth(['merchant']), createItem);
router.put('/items/:id', auth(['merchant']), updateItem);
router.delete('/items/:id', auth(['merchant']), deleteItem);

module.exports = router;
