const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    loyaltyPoints: { type: Number, default: 0 },
    membershipLevel: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
    },
    totalSpent: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    notes: [{ text: String, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, createdAt: { type: Date, default: Date.now } }],
    tags: [String],
    isActive: { type: Boolean, default: true },
    preferredBranch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    lastPurchase: Date,
  },
  { timestamps: true }
);

customerSchema.index({ phone: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ loyaltyPoints: -1 });

module.exports = mongoose.model('Customer', customerSchema);
