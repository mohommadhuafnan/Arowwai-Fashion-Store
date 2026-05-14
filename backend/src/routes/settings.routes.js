const express = require('express');
const { getSettings, updateSetting, seedSettings } = require('../controllers/settings.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/seed', authorize('super_admin'), seedSettings);
router.get('/', getSettings);
router.put('/:key', authorize('super_admin', 'shop_owner'), updateSetting);

module.exports = router;
