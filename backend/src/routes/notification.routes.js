const express = require('express');
const { getNotifications, markAsRead, markAllAsRead, createNotification } = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.post('/', createNotification);

module.exports = router;
