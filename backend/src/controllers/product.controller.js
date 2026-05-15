const fs = require('fs');
const Product = require('../models/Product.model');
const { getPaginationMeta } = require('../utils/helpers');
const QRCode = require('qrcode');
const cloudinarySvc = require('../services/cloudinary.service');

const getProducts = async (req, res) => {
  const { page = 1, limit = 20, search, category, branch, isActive } = req.query;
  const filter = {};

  if (search) filter.$text = { $search: search };
  if (category) filter.category = category;
  if (branch) filter.branch = branch;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find(filter).populate('category', 'name slug').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  res.json({ success: true, data: products, pagination: getPaginationMeta(total, page, limit) });
};

const getProduct = async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: product });
};

const getProductByBarcode = async (req, res) => {
  const product = await Product.findOne({
    $or: [{ barcode: req.params.barcode }, { 'variants.barcode': req.params.barcode }],
  }).populate('category', 'name');
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: product });
};

const createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, data: product });
};

const updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: product });
};

const deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, message: 'Product deactivated' });
};

const generateBarcode = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  const barcode = product.barcode || `TP${Date.now()}`;
  if (!product.barcode) {
    product.barcode = barcode;
    await product.save();
  }

  const qrDataUrl = await QRCode.toDataURL(barcode);
  res.json({ success: true, data: { barcode, qrCode: qrDataUrl } });
};

const uploadProductImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file provided' });
  }

  const diskPath = req.file.path;

  try {
    if (cloudinarySvc.isConfigured()) {
      let buffer = req.file.buffer;
      if (!buffer && diskPath) {
        buffer = fs.readFileSync(diskPath);
      }
      if (!buffer) {
        return res.status(400).json({ success: false, message: 'Could not read uploaded file' });
      }
      const url = await cloudinarySvc.uploadImageBuffer(buffer, req.file.mimetype);
      if (diskPath && fs.existsSync(diskPath)) {
        try {
          fs.unlinkSync(diskPath);
        } catch (_) {
          /* ignore */
        }
      }
      return res.json({ success: true, data: { url } });
    }

    if (process.env.VERCEL) {
      return res.status(503).json({
        success: false,
        message:
          'Image hosting requires Cloudinary on Vercel. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      });
    }

    if (diskPath && req.file.filename) {
      return res.json({ success: true, data: { url: `/uploads/products/${req.file.filename}` } });
    }

    if (req.file.buffer) {
      const url = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      return res.json({ success: true, data: { url } });
    }

    return res.status(400).json({ success: false, message: 'Could not process upload' });
  } catch (err) {
    console.error('uploadProductImage:', err.message);
    if (diskPath && fs.existsSync(diskPath)) {
      try {
        fs.unlinkSync(diskPath);
      } catch (_) {
        /* ignore */
      }
    }
    return res.status(500).json({
      success: false,
      message: err.message || 'Image upload failed',
    });
  }
};

module.exports = {
  getProducts, getProduct, getProductByBarcode, createProduct, updateProduct, deleteProduct, generateBarcode, uploadProductImage,
};
