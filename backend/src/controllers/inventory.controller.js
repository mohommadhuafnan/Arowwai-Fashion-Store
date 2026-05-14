const Inventory = require('../models/Inventory.model');
const Product = require('../models/Product.model');
const { getPaginationMeta } = require('../utils/helpers');

const getInventory = async (req, res) => {
  const { page = 1, limit = 20, branch, lowStock } = req.query;
  const filter = {};
  if (branch) filter.branch = branch;
  if (lowStock === 'true') {
    filter.$expr = { $lte: ['$quantity', '$lowStockThreshold'] };
  }

  const skip = (page - 1) * limit;
  const [inventory, total] = await Promise.all([
    Inventory.find(filter)
      .populate('product', 'name sku barcode images basePrice')
      .populate('branch', 'name code')
      .sort({ quantity: 1 })
      .skip(skip)
      .limit(Number(limit)),
    Inventory.countDocuments(filter),
  ]);

  res.json({ success: true, data: inventory, pagination: getPaginationMeta(total, page, limit) });
};

const updateStock = async (req, res) => {
  const { product, branch, quantity, variantSku, type = 'purchase' } = req.body;
  const update = type === 'damaged' ? { $inc: { damaged: quantity, quantity: -quantity } } : { $inc: { quantity } };

  const inventory = await Inventory.findOneAndUpdate(
    { product, branch, variantSku: variantSku || null },
    { ...update, lastRestocked: new Date() },
    { upsert: true, new: true }
  );

  await Product.findByIdAndUpdate(product, { $inc: { totalStock: type === 'damaged' ? -quantity : quantity } });
  res.json({ success: true, data: inventory });
};

const transferStock = async (req, res) => {
  const { product, fromBranch, toBranch, quantity, variantSku } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ success: false, message: 'Quantity must be greater than zero' });
  }

  const fromInventory = await Inventory.findOne({
    product,
    branch: fromBranch,
    variantSku: variantSku || null,
  });

  if (!fromInventory || fromInventory.quantity < quantity) {
    return res.status(400).json({
      success: false,
      message: `Insufficient stock at source branch (available: ${fromInventory?.quantity ?? 0})`,
    });
  }

  await Inventory.findOneAndUpdate(
    { product, branch: fromBranch, variantSku: variantSku || null },
    { $inc: { quantity: -quantity } }
  );

  const toInventory = await Inventory.findOneAndUpdate(
    { product, branch: toBranch, variantSku: variantSku || null },
    { $inc: { quantity } },
    { upsert: true, new: true }
  );

  res.json({ success: true, data: toInventory, message: 'Stock transferred successfully' });
};

const getLowStockAlerts = async (req, res) => {
  const filter = { $expr: { $lte: ['$quantity', '$lowStockThreshold'] } };
  if (req.query.branch) filter.branch = req.query.branch;

  const alerts = await Inventory.find(filter)
    .populate('product', 'name sku images')
    .populate('branch', 'name code')
    .limit(50);

  res.json({ success: true, data: alerts });
};

module.exports = { getInventory, updateStock, transferStock, getLowStockAlerts };
