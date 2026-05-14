const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, minlength: 6, select: false },
    firebaseUid: { type: String, unique: true, sparse: true },
    authProvider: {
      type: String,
      enum: ['email', 'google', 'github', 'local'],
      default: 'local',
    },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ['super_admin', 'shop_owner', 'manager', 'cashier', 'inventory_staff'],
      default: 'cashier',
    },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    refreshToken: String,
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1, branch: 1 });

userSchema.index({ firebaseUid: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', userSchema);
