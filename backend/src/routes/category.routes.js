const express = require('express');
const { getCategories, createCategory, updateCategory, deleteCategory, seedCategories } = require('../controllers/category.controller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/seed', authorize('super_admin'), seedCategories);
router.get('/', getCategories);
router.post('/', authorize('super_admin', 'shop_owner', 'manager'), createCategory);
router.put('/:id', authorize('super_admin', 'shop_owner', 'manager'), updateCategory);
router.delete('/:id', authorize('super_admin', 'shop_owner'), deleteCategory);

module.exports = router;
