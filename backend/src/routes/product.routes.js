const express = require('express');
const {
  getProducts, getProduct, getProductByBarcode, createProduct, updateProduct, deleteProduct, generateBarcode, uploadProductImage,
} = require('../controllers/product.controller');
const { uploadProductImage: uploadMiddleware } = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', getProducts);
router.get('/barcode/:barcode', getProductByBarcode);
router.post('/upload-image', authorize('super_admin', 'shop_owner', 'manager', 'inventory_staff'), uploadMiddleware.single('image'), uploadProductImage);
router.get('/:id', getProduct);
router.post('/', authorize('super_admin', 'shop_owner', 'manager', 'inventory_staff'), createProduct);
router.put('/:id', authorize('super_admin', 'shop_owner', 'manager', 'inventory_staff'), updateProduct);
router.delete('/:id', authorize('super_admin', 'shop_owner', 'manager'), deleteProduct);
router.post('/:id/barcode', generateBarcode);

module.exports = router;
