const express = require('express');
const { getEmployees, createEmployee, recordAttendance, addCommission } = require('../controllers/employee.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', getEmployees);
router.post('/', authorize('super_admin', 'shop_owner', 'manager'), createEmployee);
router.post('/:id/attendance', recordAttendance);
router.post('/:id/commission', authorize('super_admin', 'shop_owner', 'manager'), addCommission);

module.exports = router;
