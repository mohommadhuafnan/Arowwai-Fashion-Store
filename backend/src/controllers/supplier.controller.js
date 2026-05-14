const Supplier = require('../models/Supplier.model');
const { getPaginationMeta } = require('../utils/helpers');

const getSuppliers = async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const filter = { isActive: true };
  if (search) filter.name = { $regex: search, $options: 'i' };

  const skip = (page - 1) * limit;
  const [suppliers, total] = await Promise.all([
    Supplier.find(filter).sort({ name: 1 }).skip(skip).limit(Number(limit)),
    Supplier.countDocuments(filter),
  ]);

  res.json({ success: true, data: suppliers, pagination: getPaginationMeta(total, page, limit) });
};

const createSupplier = async (req, res) => {
  const supplier = await Supplier.create(req.body);
  res.status(201).json({ success: true, data: supplier });
};

const updateSupplier = async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
  res.json({ success: true, data: supplier });
};

const createPurchaseOrder = async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(
    req.params.id,
    { $push: { purchaseOrders: req.body }, $inc: { totalDue: req.body.total } },
    { new: true }
  );
  res.json({ success: true, data: supplier });
};

module.exports = { getSuppliers, createSupplier, updateSupplier, createPurchaseOrder };
