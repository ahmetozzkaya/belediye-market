const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  getStats, getUsers, toggleUser, getMunicipality, updateMunicipality,
  getRestaurants, approveRestaurant, rejectRestaurant, toggleRestaurant,
  getCommissionReport, getCouriers,
} = require('../controllers/adminController');

router.get('/stats', auth(['admin']), getStats);
router.get('/users', auth(['admin']), getUsers);
router.patch('/users/:id/toggle', auth(['admin']), toggleUser);
router.get('/municipality', auth(['admin']), getMunicipality);
router.put('/municipality', auth(['admin']), updateMunicipality);

router.get('/restaurants', auth(['admin']), getRestaurants);
router.patch('/restaurants/:id/approve', auth(['admin']), approveRestaurant);
router.patch('/restaurants/:id/reject', auth(['admin']), rejectRestaurant);
router.patch('/restaurants/:id/toggle', auth(['admin']), toggleRestaurant);

router.get('/commission', auth(['admin']), getCommissionReport);
router.get('/couriers', auth(['admin']), getCouriers);

module.exports = router;
