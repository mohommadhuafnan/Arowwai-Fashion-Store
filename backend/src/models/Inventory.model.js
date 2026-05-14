const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    variantSku: String,
    quantity: { type: Number, default: 0, min: 0 },
    reserved: { type: Number, default: 0, min: 0 },
    damaged: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    warehouse: { type: String, default: 'main' },
    lastRestocked: Date,
    notes: String,
  },
  { timestamps: true }
);

inventorySchema.index({ product: 1, branch: 1, variantSku: 1 }, { unique: true });
inventorySchema.index({ quantity: 1, lowStockThreshold: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
