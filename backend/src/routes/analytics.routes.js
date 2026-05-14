const express = require('express');
const { getDashboardStats, getAIInsights, getSalesChart } = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/ai-insights', getAIInsights);
router.get('/sales-chart', getSalesChart);

module.exports = router;
