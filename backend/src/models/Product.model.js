const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  size: { type: String, trim: true },
  color: { type: String, trim: true },
  brand: { type: String, trim: true },
  material: { type: String, trim: true },
  season: { type: String, enum: ['spring', 'summer', 'autumn', 'winter', 'all-season'], default: 'all-season' },
  gender: { type: String, enum: ['men', 'women', 'unisex', 'kids'], default: 'unisex' },
  sku: { type: String, required: true, trim: true },
  barcode: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, default: 0, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  image: String,
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    sku: { type: String, required: true, trim: true },
    barcode: { type: String, trim: true },
    images: [String],
    basePrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 18 },
    variants: [variantSchema],
    brand: String,
    material: String,
    season: { type: String, enum: ['spring', 'summer', 'autumn', 'winter', 'all-season'], default: 'all-season' },
    gender: { type: String, enum: ['men', 'women', 'unisex', 'kids'], default: 'unisex' },
    tags: [String],
    isActive: { type: Boolean, default: true },
    totalStock: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ sku: 1 });
productSchema.index({ barcode: 1 });
productSchema.index({ name: 'text', sku: 'text', brand: 'text' });
productSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
