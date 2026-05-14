const Sale = require('../models/Sale.model');
const Product = require('../models/Product.model');
const Customer = require('../models/Customer.model');
const Inventory = require('../models/Inventory.model');
const { getPaginationMeta } = require('../utils/helpers');
const { getIO } = require('../config/socket');

const generateInvoiceNumber = async () => {
  const count = await Sale.countDocuments();
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `INV-${date}-${String(count + 1).padStart(5, '0')}`;
};

const getSales = async (req, res) => {
  const { page = 1, limit = 20, branch, status, startDate, endDate } = req.query;
  const filter = {};
  if (branch) filter.branch = branch;
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;
  const [sales, total] = await Promise.all([
    Sale.find(filter)
      .populate('customer', 'firstName lastName phone')
      .populate('cashier', 'firstName lastName')
      .populate('branch', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Sale.countDocuments(filter),
  ]);

  res.json({ success: true, data: sales, pagination: getPaginationMeta(total, page, limit) });
};

const createSale = async (req, res) => {
  const saleData = { ...req.body, cashier: req.user._id };

  if (!saleData.branch) {
    return res.status(400).json({ success: false, message: 'Branch is required for sales' });
  }

  for (const item of saleData.items) {
    const inventory = await Inventory.findOne({ product: item.product, branch: saleData.branch });
    const available = inventory?.quantity ?? 0;
    if (available < item.quantity) {
      const product = await Product.findById(item.product).select('name');
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for ${product?.name || 'product'} (available: ${available}, requested: ${item.quantity})`,
      });
    }
  }

  const invoiceNumber = await generateInvoiceNumber();
  saleData.invoiceNumber = invoiceNumber;

  for (const item of saleData.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { soldCount: item.quantity } });
    await Inventory.findOneAndUpdate(
      { product: item.product, branch: saleData.branch },
      { $inc: { quantity: -item.quantity } }
    );
  }

  if (saleData.customer) {
    const pointsEarned = Math.floor(saleData.total / 100);
    saleData.loyaltyPointsEarned = pointsEarned;
    await Customer.findByIdAndUpdate(saleData.customer, {
      $inc: { totalSpent: saleData.total, totalOrders: 1, loyaltyPoints: pointsEarned },
      lastPurchase: new Date(),
    });
  }

  const sale = await Sale.create(saleData);

  try {
    const io = getIO();
    if (io) {
      io.to(`branch-${sale.branch}`).emit('new-sale', sale);
      io.emit('live-activity', { type: 'sale', data: sale });
    }
  } catch (_) {}

  res.status(201).json({ success: true, data: sale });
};

const getSale = async (req, res) => {
  const sale = await Sale.findById(req.params.id)
    .populate('customer')
    .populate('cashier', 'firstName lastName')
    .populate('branch', 'name code address')
    .populate('items.product', 'name sku images');
  if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
  res.json({ success: true, data: sale });
};

const getSaleByInvoice = async (req, res) => {
  const invoiceNumber = decodeURIComponent(req.params.invoiceNumber);
  const sale = await Sale.findOne({ invoiceNumber })
    .populate('branch', 'name code address city')
    .populate('items.product', 'name sku images')
    .select('-__v');
  if (!sale) return res.status(404).json({ success: false, message: 'Invoice not found' });
  res.json({ success: true, data: sale });
};

module.exports = { getSales, createSale, getSale, getSaleByInvoice };
