const router = require('express').Router();
const auth = require('../middleware/auth');
const { getAll, create, update, setDefault, remove } = require('../controllers/addressController');

router.get('/', auth(), getAll);
router.post('/', auth(), create);
router.put('/:id', auth(), update);
router.patch('/:id/default', auth(), setDefault);
router.delete('/:id', auth(), remove);

module.exports = router;
