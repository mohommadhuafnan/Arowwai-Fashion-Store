const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  SHOP_OWNER: 'shop_owner',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  INVENTORY_STAFF: 'inventory_staff',
};

const ROLE_HIERARCHY = {
  super_admin: 5,
  shop_owner: 4,
  manager: 3,
  cashier: 2,
  inventory_staff: 1,
};

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password').populate('branch', 'name code');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized for this action`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize, ROLES, ROLE_HIERARCHY };
