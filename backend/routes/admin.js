const router = require('express').Router();
const { getStats, getUsers, toggleUser, getMunicipality, updateMunicipality } = require('../controllers/adminController');
const auth = require('../middleware/auth');

router.get('/stats', auth(['admin']), getStats);
router.get('/users', auth(['admin']), getUsers);
router.patch('/users/:id/toggle', auth(['admin']), toggleUser);
router.get('/municipality', auth(['admin']), getMunicipality);
router.put('/municipality', auth(['admin']), updateMunicipality);

module.exports = router;
