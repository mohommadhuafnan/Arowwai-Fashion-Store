const Sale = require('../models/Sale.model');
const Product = require('../models/Product.model');
const Customer = require('../models/Customer.model');
const Inventory = require('../models/Inventory.model');
const githubAi = require('../services/githubAi.service');

const DAY_MS = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD in Asia/Colombo (store day for “today” / “yesterday”). */
function colomboYmd(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function colomboDayRange(ymd) {
  const start = new Date(`${ymd}T00:00:00+05:30`);
  const end = new Date(`${ymd}T23:59:59.999+05:30`);
  return { start, end };
}

async function buildStoreSnapshot() {
  const todayYmd = colomboYmd(new Date());
  const todayRange = colomboDayRange(todayYmd);
  const yesterdayYmd = colomboYmd(new Date(todayRange.start.getTime() - 1));
  const yesterdayRange = colomboDayRange(yesterdayYmd);
  const since7d = new Date(Date.now() - 7 * DAY_MS);
  const since24h = new Date(Date.now() - DAY_MS);

  const [
    topProducts,
    lowStock,
    salesTrend,
    customerCount,
    avgOrder,
    todayAgg,
    yesterdayAgg,
    last7Agg,
    last24Agg,
    recentInvoices,
  ] = await Promise.all([
    Product.find({ isActive: true }).sort({ soldCount: -1 }).limit(10).select('name soldCount basePrice totalStock'),
    Inventory.find({ $expr: { $lte: ['$quantity', '$lowStockThreshold'] } })
      .populate('product', 'name sku')
      .limit(15),
    Sale.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: new Date(Date.now() - 30 * DAY_MS) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Customer.countDocuments({ isActive: true }),
    Sale.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, avg: { $avg: '$total' }, count: { $sum: 1 } } },
    ]),
    Sale.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: todayRange.start, $lte: todayRange.end },
        },
      },
      { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
    ]),
    Sale.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: yesterdayRange.start, $lte: yesterdayRange.end },
        },
      },
      { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
    ]),
    Sale.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: since7d } } },
      { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
    ]),
    Sale.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: since24h } } },
      { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
    ]),
    Sale.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('invoiceNumber total createdAt')
      .lean(),
  ]);

  const todaySales = {
    date: todayYmd,
    timezone: 'Asia/Colombo',
    revenue: Math.round(todayAgg[0]?.revenue || 0),
    orders: todayAgg[0]?.orders || 0,
  };
  const yesterdaySales = {
    date: yesterdayYmd,
    revenue: Math.round(yesterdayAgg[0]?.revenue || 0),
    orders: yesterdayAgg[0]?.orders || 0,
  };
  const last7Days = {
    revenue: Math.round(last7Agg[0]?.revenue || 0),
    orders: last7Agg[0]?.orders || 0,
  };
  const last24Hours = {
    revenue: Math.round(last24Agg[0]?.revenue || 0),
    orders: last24Agg[0]?.orders || 0,
    since: since24h.toISOString(),
  };

  return {
    store: 'AROWWAI Fashion Store',
    location: 'Mawanella, Sri Lanka',
    currency: 'LKR',
    snapshotGeneratedAt: new Date().toISOString(),
    todaySales,
    yesterdaySales,
    last7Days,
    last24Hours,
    recentInvoices: (recentInvoices || []).map((s) => ({
      invoice: s.invoiceNumber,
      total: s.total,
      at: s.createdAt,
    })),
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
  const userMessage = String(req.body?.message || '').trim();
  try {
    if (!userMessage) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const snapshot = await buildStoreSnapshot();

    const rawHistory = Array.isArray(req.body?.history) ? req.body.history : [];
    const history = rawHistory
      .filter((h) => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
      .slice(-10)
      .map((h) => ({ role: h.role, content: h.content.slice(0, 3500) }));

    if (!githubAi.isConfigured()) {
      return res.json({
        success: true,
        data: {
          reply: githubAi.localRetailReply(userMessage, snapshot, { fallbackReason: 'not-configured' }),
          model: 'local-fallback',
          source: 'fallback',
        },
      });
    }

    const reply = await githubAi.askRetailAssistant(userMessage, snapshot, history);
    const usedFallback =
      reply.includes('GITHUB_TOKEN') || reply.includes('GitHub Models is busy') || reply.includes('Live AI had a hiccup');

    res.json({
      success: true,
      data: {
        reply,
        model: usedFallback ? 'local-fallback' : githubAi.getModel(),
        source: usedFallback ? 'fallback' : 'github-ai',
      },
    });
  } catch (err) {
    console.error('AI chat error:', err.message);
    const snapshot = await buildStoreSnapshot();
    res.json({
      success: true,
      data: {
        reply: githubAi.localRetailReply(userMessage, snapshot, { fallbackReason: 'error' }),
        model: 'local-fallback',
        source: 'fallback',
      },
    });
  }
};

module.exports = { getStatus, postChat, buildStoreSnapshot };
