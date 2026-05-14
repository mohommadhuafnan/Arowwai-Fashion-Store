const express = require('express');
const { getStatus, sendInvoice } = require('../controllers/whatsapp.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/status', protect, getStatus);
router.post(
  '/send-invoice',
  protect,
  authorize('super_admin', 'shop_owner', 'manager', 'cashier'),
  sendInvoice,
);

module.exports = router;
