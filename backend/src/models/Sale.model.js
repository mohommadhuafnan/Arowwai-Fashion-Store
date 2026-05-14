const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  sku: String,
  variant: {
    size: String,
    color: String,
    sku: String,
  },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
});

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['cash', 'card', 'qr', 'wallet', 'bank_transfer'],
    required: true,
  },
  amount: { type: Number, required: true },
  reference: String,
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'completed' },
});

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [saleItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: String,
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    payments: [paymentSchema],
    paymentStatus: { type: String, enum: ['paid', 'partial', 'pending', 'refunded'], default: 'paid' },
    status: { type: String, enum: ['completed', 'pending', 'cancelled', 'refunded'], default: 'completed' },
    notes: String,
    loyaltyPointsEarned: { type: Number, default: 0 },
    loyaltyPointsRedeemed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

saleSchema.index({ invoiceNumber: 1 });
saleSchema.index({ branch: 1, createdAt: -1 });
saleSchema.index({ customer: 1 });
saleSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Sale', saleSchema);
