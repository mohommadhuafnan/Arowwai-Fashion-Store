const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: String,
    image: String,
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    type: {
      type: String,
      enum: ['men', 'women', 'kids', 'shoes', 'accessories', 'sportswear', 'casual', 'formal', 'summer', 'winter', 'general'],
      default: 'general',
    },
  },
  { timestamps: true }
);

categorySchema.index({ slug: 1 });
categorySchema.index({ type: 1 });

module.exports = mongoose.model('Category', categorySchema);
