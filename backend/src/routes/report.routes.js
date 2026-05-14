const express = require('express');
const { getSalesReport, getInventoryReport, getTaxReport } = require('../controllers/report.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/sales', authorize('super_admin', 'shop_owner', 'manager'), getSalesReport);
router.get('/inventory', authorize('super_admin', 'shop_owner', 'manager', 'inventory_staff'), getInventoryReport);
router.get('/tax', authorize('super_admin', 'shop_owner', 'manager'), getTaxReport);

module.exports = router;
