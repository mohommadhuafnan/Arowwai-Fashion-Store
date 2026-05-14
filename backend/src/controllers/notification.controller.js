const Notification = require('../models/Notification.model');

const getNotifications = async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ success: true, data: notifications });
};

const markAsRead = async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ success: true, message: 'Marked as read' });
};

const markAllAsRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id }, { isRead: true });
  res.json({ success: true, message: 'All marked as read' });
};

const createNotification = async (req, res) => {
  const notification = await Notification.create({ ...req.body, user: req.body.user || req.user._id });
  res.status(201).json({ success: true, data: notification });
};

module.exports = { getNotifications, markAsRead, markAllAsRead, createNotification };
