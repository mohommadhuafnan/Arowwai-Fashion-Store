const Customer = require('../models/Customer.model');
const Sale = require('../models/Sale.model');
const { getPaginationMeta } = require('../utils/helpers');

const getCustomers = async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const filter = { isActive: true };
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const [customers, total] = await Promise.all([
    Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Customer.countDocuments(filter),
  ]);

  res.json({ success: true, data: customers, pagination: getPaginationMeta(total, page, limit) });
};

const getCustomer = async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

  const purchaseHistory = await Sale.find({ customer: customer._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('invoiceNumber total status createdAt items');

  res.json({ success: true, data: { customer, purchaseHistory } });
};

const createCustomer = async (req, res) => {
  const customer = await Customer.create(req.body);
  res.status(201).json({ success: true, data: customer });
};

const updateCustomer = async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
  res.json({ success: true, data: customer });
};

const addCustomerNote = async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    { $push: { notes: { text: req.body.text, createdBy: req.user._id } } },
    { new: true }
  );
  res.json({ success: true, data: customer });
};

const redeemLoyaltyPoints = async (req, res) => {
  const { points } = req.body;
  const customer = await Customer.findById(req.params.id);
  if (!customer || customer.loyaltyPoints < points) {
    return res.status(400).json({ success: false, message: 'Insufficient loyalty points' });
  }
  customer.loyaltyPoints -= points;
  await customer.save();
  res.json({ success: true, data: customer });
};

module.exports = { getCustomers, getCustomer, createCustomer, updateCustomer, addCustomerNote, redeemLoyaltyPoints };
