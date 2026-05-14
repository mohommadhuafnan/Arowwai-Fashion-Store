const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    company: String,
    email: { type: String, lowercase: true },
    phone: { type: String, required: true },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    contactPerson: String,
    taxId: String,
    paymentTerms: { type: String, default: 'Net 30' },
    totalDue: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    purchaseOrders: [{
      poNumber: String,
      items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, quantity: Number, unitCost: Number }],
      total: Number,
      status: { type: String, enum: ['pending', 'ordered', 'received', 'cancelled'], default: 'pending' },
      dueDate: Date,
      createdAt: { type: Date, default: Date.now },
    }],
    isActive: { type: Boolean, default: true },
    notes: String,
    rating: { type: Number, min: 1, max: 5 },
  },
  { timestamps: true }
);

supplierSchema.index({ name: 1 });
supplierSchema.index({ phone: 1 });

module.exports = mongoose.model('Supplier', supplierSchema);
