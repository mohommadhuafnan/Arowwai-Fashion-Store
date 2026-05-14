const Sale = require('../models/Sale.model');
const Product = require('../models/Product.model');
const Customer = require('../models/Customer.model');
const Inventory = require('../models/Inventory.model');
const githubAi = require('../services/githubAi.service');

async function buildStoreSnapshot() {
  const [topProducts, lowStock, salesTrend, customerCount, avgOrder] = await Promise.all([
    Product.find({ isActive: true }).sort({ soldCount: -1 }).limit(10).select('name soldCount basePrice totalStock'),
    Inventory.find({ $expr: { $lte: ['$quantity', '$lowStockThreshold'] } })
      .populate('product', 'name sku')
      .limit(15),
    Sale.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Customer.countDocuments({ isActive: true }),
    Sale.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, avg: { $avg: '$total' }, count: { $sum: 1 } } },
    ]),
  ]);

  return {
    store: 'AROWWAI Fashion Store',
    location: 'Mawanella, Sri Lanka',
    currency: 'LKR',
    topProducts: topProducts.map((p) => ({
      name: p.name,
      soldCount: p.soldCount,
      price: p.basePrice,
      stock: p.totalStock,
    })),
    lowStock: lowStock.map((i) => ({
      product: i.product?.name,
      quantity: i.quantity,
      threshold: i.lowStockThreshold,
    })),
    salesTrend,
    customerCount,
    avgOrderValue: Math.round(avgOrder[0]?.avg || 0),
    totalOrders: avgOrder[0]?.count || 0,
  };
}

const getStatus = async (req, res) => {
  res.json({
    success: true,
    data: {
      configured: githubAi.isConfigured(),
      model: githubAi.getModel(),
      provider: 'GitHub Models',
    },
  });
};

const postChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    if (!githubAi.isConfigured()) {
      return res.status(503).json({ success: false, message: 'AI not configured. Set GITHUB_TOKEN in backend/.env' });
    }

    const snapshot = await buildStoreSnapshot();
    const reply = await githubAi.askRetailAssistant(message.trim(), snapshot);

    res.json({
      success: true,
      data: { reply, model: githubAi.getModel() },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'AI chat failed' });
  }
};

module.exports = { getStatus, postChat, buildStoreSnapshot };
