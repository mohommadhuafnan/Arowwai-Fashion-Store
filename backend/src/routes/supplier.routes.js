const express = require('express');
const { getSuppliers, createSupplier, updateSupplier, createPurchaseOrder } = require('../controllers/supplier.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', getSuppliers);
router.post('/', authorize('super_admin', 'shop_owner', 'manager', 'inventory_staff'), createSupplier);
router.put('/:id', authorize('super_admin', 'shop_owner', 'manager'), updateSupplier);
router.post('/:id/purchase-orders', authorize('super_admin', 'shop_owner', 'manager', 'inventory_staff'), createPurchaseOrder);

module.exports = router;
