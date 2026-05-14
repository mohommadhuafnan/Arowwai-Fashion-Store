const express = require('express');
const {
  getCustomers, getCustomer, createCustomer, updateCustomer, addCustomerNote, redeemLoyaltyPoints,
} = require('../controllers/customer.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.post('/', authorize('super_admin', 'shop_owner', 'manager', 'cashier'), createCustomer);
router.put('/:id', authorize('super_admin', 'shop_owner', 'manager', 'cashier'), updateCustomer);
router.post('/:id/notes', addCustomerNote);
router.post('/:id/redeem-points', redeemLoyaltyPoints);

module.exports = router;
