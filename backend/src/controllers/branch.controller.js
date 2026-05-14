const Branch = require('../models/Branch.model');
const Sale = require('../models/Sale.model');

const getBranches = async (req, res) => {
  const branches = await Branch.find({ isActive: true }).populate('manager', 'firstName lastName email');
  res.json({ success: true, data: branches });
};

const createBranch = async (req, res) => {
  const branch = await Branch.create(req.body);
  res.status(201).json({ success: true, data: branch });
};

const updateBranch = async (req, res) => {
  const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
  res.json({ success: true, data: branch });
};

const getBranchAnalytics = async (req, res) => {
  const branchId = req.params.id;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const mongoose = require('mongoose');
  const branchObjectId = new mongoose.Types.ObjectId(branchId);

  const [monthlySales, totalSales, branch] = await Promise.all([
    Sale.aggregate([
      { $match: { branch: branchObjectId, createdAt: { $gte: startOfMonth }, status: 'completed' } },
      { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Sale.countDocuments({ branch: branchId, status: 'completed' }),
    Branch.findById(branchId),
  ]);

  res.json({
    success: true,
    data: {
      branch,
      monthlyRevenue: monthlySales[0]?.revenue || 0,
      monthlyOrders: monthlySales[0]?.count || 0,
      totalSales,
    },
  });
};

module.exports = { getBranches, createBranch, updateBranch, getBranchAnalytics };
