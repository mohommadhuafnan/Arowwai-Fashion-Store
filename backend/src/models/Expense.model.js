const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    category: { type: String, required: true },
    description: String,
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    paymentMethod: String,
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receipt: String,
    isRecurring: { type: Boolean, default: false },
  },
  { timestamps: true }
);

expenseSchema.index({ branch: 1, date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
