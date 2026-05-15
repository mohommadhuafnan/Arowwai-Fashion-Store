const Sale = require('../models/Sale.model');
const Product = require('../models/Product.model');
const Customer = require('../models/Customer.model');
const Inventory = require('../models/Inventory.model');
const Expense = require('../models/Expense.model');
const githubAi = require('../services/githubAi.service');
const { buildStoreSnapshot } = require('./ai.controller');

const getDashboardStats = async (req, res) => {
  const { branch } = req.query;
  const filter = branch ? { branch } : {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todaySales, monthlySales, totalSales, topProducts, lowStock, recentOrders, customerCount] = await Promise.all([
    Sale.aggregate([
      { $match: { ...filter, createdAt: { $gte: today }, status: 'completed' } },
      { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Sale.aggregate([
      { $match: { ...filter, createdAt: { $gte: startOfMonth }, status: 'completed' } },
      { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Sale.aggregate([
      { $match: { ...filter, status: 'completed' } },
      { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Product.find(filter.branch ? {} : {}).sort({ soldCount: -1 }).limit(5).select('name soldCount basePrice images'),
    Inventory.find({ $expr: { $lte: ['$quantity', '$lowStockThreshold'] } })
      .populate('product', 'name sku')
      .limit(10),
    Sale.find({ ...filter, status: 'completed' })
      .populate('customer', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('invoiceNumber total createdAt customer'),
    Customer.countDocuments({ isActive: true }),
  ]);

  const expenses = await Expense.aggregate([
    { $match: { ...(branch ? { branch } : {}), date: { $gte: startOfMonth } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const monthlyRevenue = monthlySales[0]?.revenue || 0;
  const monthlyExpenses = expenses[0]?.total || 0;

  res.json({
    success: true,
    data: {
      todayRevenue: todaySales[0]?.revenue || 0,
      todayOrders: todaySales[0]?.count || 0,
      monthlyRevenue,
      monthlyOrders: monthlySales[0]?.count || 0,
      totalRevenue: totalSales[0]?.revenue || 0,
      totalOrders: totalSales[0]?.count || 0,
      profit: monthlyRevenue - monthlyExpenses,
      topProducts,
      lowStockAlerts: lowStock,
      recentOrders,
      customerCount,
    },
  });
};

const getAIInsights = async (req, res) => {
  const emptySnapshot = {
    store: 'AROWWAI Fashion Store',
    location: 'Mawanella, Sri Lanka',
    currency: 'LKR',
    topProducts: [],
    lowStock: [],
    salesTrend: [],
    customerCount: 0,
    avgOrderValue: 0,
    totalOrders: 0,
  };

  const buildFallback = (snapshot) => {
    const { topProducts, lowStock, salesTrend } = snapshot;
    const predictions = (topProducts || []).slice(0, 5).map((p) => ({
      product: p.name,
      currentSales: p.soldCount || 0,
      predictedDemand: Math.ceil((p.soldCount || 0) * 1.15),
      recommendation: (p.soldCount || 0) > 50 ? 'Increase stock by 20%' : 'Monitor closely',
    }));

    const restockSuggestions = (lowStock || []).map((item) => ({
      product: item.product,
      currentStock: item.quantity,
      suggestedOrder: Math.max((item.threshold || 5) * 3 - item.quantity, 10),
      urgency: item.quantity === 0 ? 'critical' : item.quantity <= 2 ? 'high' : 'medium',
    }));

    const trendRevenue = (salesTrend || []).reduce((a, b) => a + (b.revenue || 0), 0);
    const avgDaily = trendRevenue / Math.max((salesTrend || []).length, 1);

    return {
      salesPrediction: {
        nextMonthRevenue: Math.ceil(avgDaily * 30 * 1.08) || 0,
        trend: 'stable',
        confidence: 0.75,
      },
      demandPredictions: predictions,
      restockSuggestions,
      salesTrend: salesTrend || [],
      customerInsights: {
        avgOrderValue: snapshot.avgOrderValue || 0,
        repeatRate: 65,
        topSegment: 'Regular Customers',
      },
      seasonalRecommendations: [
        { season: 'Summer', products: ['Linen Shirts', 'Cotton Dresses', 'Sandals'] },
        { season: 'Winter', products: ['Wool Coats', 'Thermal Wear', 'Boots'] },
      ],
      aiSummary: 'Using local analytics. Connect GITHUB_TOKEN for live AI insights.',
      source: 'fallback',
    };
  };

  try {
    let snapshot;
    try {
      snapshot = await buildStoreSnapshot();
    } catch (dbErr) {
      console.error('AI insights DB error:', dbErr.message);
      snapshot = emptySnapshot;
    }

    if (!githubAi.isConfigured()) {
      return res.json({ success: true, data: buildFallback(snapshot) });
    }

    try {
      const aiData = await githubAi.generateStoreInsights(snapshot);
      return res.json({
        success: true,
        data: {
          ...aiData,
          salesTrend: salesTrend || [],
          source: 'github-ai',
          model: githubAi.getModel(),
        },
      });
    } catch (err) {
      console.error('AI insights error:', err.message);
      return res.json({ success: true, data: { ...buildFallback(snapshot), aiError: err.message } });
    }
  } catch (err) {
    console.error('AI insights fatal:', err.message);
    return res.json({ success: true, data: buildFallback(emptySnapshot) });
  }
};

const getSalesChart = async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const data = await Sale.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: startDate } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  res.json({ success: true, data });
};

module.exports = { getDashboardStats, getAIInsights, getSalesChart };
