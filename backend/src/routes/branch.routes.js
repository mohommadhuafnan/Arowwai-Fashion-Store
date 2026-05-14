const express = require('express');
const { getBranches, createBranch, updateBranch, getBranchAnalytics } = require('../controllers/branch.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', getBranches);
router.get('/:id/analytics', getBranchAnalytics);
router.post('/', authorize('super_admin', 'shop_owner'), createBranch);
router.put('/:id', authorize('super_admin', 'shop_owner'), updateBranch);

module.exports = router;
