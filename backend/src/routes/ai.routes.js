const express = require('express');
const { getStatus, postChat } = require('../controllers/ai.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/status', protect, getStatus);
router.post('/chat', protect, postChat);

module.exports = router;
