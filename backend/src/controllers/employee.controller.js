const Employee = require('../models/Employee.model');
const User = require('../models/User.model');
const { getPaginationMeta } = require('../utils/helpers');

const getEmployees = async (req, res) => {
  const { page = 1, limit = 20, branch } = req.query;
  const filter = { isActive: true };
  if (branch) filter.branch = branch;

  const skip = (page - 1) * limit;
  const [employees, total] = await Promise.all([
    Employee.find(filter)
      .populate('user', 'firstName lastName email role avatar')
      .populate('branch', 'name code')
      .skip(skip)
      .limit(Number(limit)),
    Employee.countDocuments(filter),
  ]);

  res.json({ success: true, data: employees, pagination: getPaginationMeta(total, page, limit) });
};

const createEmployee = async (req, res) => {
  const employee = await Employee.create(req.body);
  res.status(201).json({ success: true, data: employee });
};

const recordAttendance = async (req, res) => {
  const { status, checkIn, checkOut } = req.body;
  const employee = await Employee.findByIdAndUpdate(
    req.params.id,
    { $push: { attendance: { date: new Date(), status, checkIn, checkOut } } },
    { new: true }
  );
  res.json({ success: true, data: employee });
};

const addCommission = async (req, res) => {
  const employee = await Employee.findByIdAndUpdate(
    req.params.id,
    { $inc: { totalCommission: req.body.amount } },
    { new: true }
  );
  res.json({ success: true, data: employee });
};

module.exports = { getEmployees, createEmployee, recordAttendance, addCommission };
