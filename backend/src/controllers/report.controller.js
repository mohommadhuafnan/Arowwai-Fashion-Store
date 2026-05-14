const Sale = require('../models/Sale.model');
const Inventory = require('../models/Inventory.model');
const Customer = require('../models/Customer.model');
const Expense = require('../models/Expense.model');

const getSalesReport = async (req, res) => {
  const { startDate, endDate, branch } = req.query;
  const filter = { status: 'completed' };
  if (branch) filter.branch = branch;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const [sales, summary] = await Promise.all([
    Sale.find(filter).populate('customer', 'firstName lastName').populate('branch', 'name').sort({ createdAt: -1 }),
    Sale.aggregate([
      { $match: filter },
      { $group: { _id: null, totalRevenue: { $sum: '$total' }, totalTax: { $sum: '$tax' }, totalDiscount: { $sum: '$discount' }, count: { $sum: 1 } } },
    ]),
  ]);

  res.json({ success: true, data: { sales, summary: summary[0] || {} } });
};

const getInventoryReport = async (req, res) => {
  const inventory = await Inventory.find()
    .populate('product', 'name sku basePrice costPrice')
    .populate('branch', 'name');

  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * (item.product?.costPrice || 0)), 0);
  const lowStock = inventory.filter((i) => i.quantity <= i.lowStockThreshold);

  res.json({ success: true, data: { inventory, totalValue, lowStockCount: lowStock.length } });
};

const getTaxReport = async (req, res) => {
  const { startDate, endDate } = req.query;
  const filter = { status: 'completed' };
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const taxData = await Sale.aggregate([
    { $match: filter },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, totalTax: { $sum: '$tax' }, revenue: { $sum: '$total' } } },
    { $sort: { _id: 1 } },
  ]);

  res.json({ success: true, data: taxData });
};

module.exports = { getSalesReport, getInventoryReport, getTaxReport };
