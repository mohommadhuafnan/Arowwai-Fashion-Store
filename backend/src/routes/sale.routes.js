const express = require('express');
const { getSales, createSale, getSale, getSaleByInvoice } = require('../controllers/sale.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/invoice/:invoiceNumber', getSaleByInvoice);

router.use(protect);

router.get('/', getSales);
router.get('/:id', getSale);
router.post('/', authorize('super_admin', 'shop_owner', 'manager', 'cashier'), createSale);

module.exports = router;
