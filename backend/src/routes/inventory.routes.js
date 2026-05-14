const express = require('express');
const { getInventory, updateStock, transferStock, getLowStockAlerts } = require('../controllers/inventory.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', getInventory);
router.get('/alerts', getLowStockAlerts);
router.post('/update', authorize('super_admin', 'shop_owner', 'manager', 'inventory_staff'), updateStock);
router.post('/transfer', authorize('super_admin', 'shop_owner', 'manager', 'inventory_staff'), transferStock);

module.exports = router;
