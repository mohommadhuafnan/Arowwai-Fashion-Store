const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    employeeId: { type: String, required: true, unique: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    department: { type: String, default: 'Sales' },
    position: String,
    hireDate: { type: Date, default: Date.now },
    salary: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 0 },
    totalCommission: { type: Number, default: 0 },
    attendance: [{
      date: Date,
      checkIn: Date,
      checkOut: Date,
      status: { type: String, enum: ['present', 'absent', 'late', 'half-day'], default: 'present' },
    }],
    shifts: [{
      day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
      startTime: String,
      endTime: String,
    }],
    activityLogs: [{
      action: String,
      details: String,
      timestamp: { type: Date, default: Date.now },
    }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ user: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
