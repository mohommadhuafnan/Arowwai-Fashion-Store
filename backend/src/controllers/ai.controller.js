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

/** Smaller JSON for chat so GitHub Models requests stay fast and under size limits. */
function compactSnapshotForChat(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return snapshot;
  const st = snapshot.salesTrend;
  const trendTail = Array.isArray(st) ? st.slice(-14) : [];
  return {
    store: snapshot.store,
    location: snapshot.location,
    currency: snapshot.currency,
    snapshotGeneratedAt: snapshot.snapshotGeneratedAt,
    todaySales: snapshot.todaySales,
    yesterdaySales: snapshot.yesterdaySales,
    last7Days: snapshot.last7Days,
    last24Hours: snapshot.last24Hours,
    recentInvoices: (snapshot.recentInvoices || []).slice(0, 6),
    topProducts: (snapshot.topProducts || []).slice(0, 8),
    lowStock: (snapshot.lowStock || []).slice(0, 12),
    salesTrend: trendTail,
    customerCount: snapshot.customerCount,
    avgOrderValue: snapshot.avgOrderValue,
    totalOrders: snapshot.totalOrders,
  };
}

const getStatus = async (req, res) => {
  const configured = githubAi.isConfigured();
  res.json({
    success: true,
    data: {
      configured,
      model: githubAi.getModel(),
      provider: 'GitHub Models',
      hint: configured
        ? 'Chat uses GitHub Models with a live POS snapshot. Put GITHUB_TOKEN only on the API server (e.g. Vercel env for the backend), not in NEXT_PUBLIC_ variables.'
        : 'Set GITHUB_TOKEN (GitHub PAT with models:read) on your deployed API server, redeploy, then refresh this page.',
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
    const chatSnapshot = compactSnapshotForChat(snapshot);

    const rawHistory = Array.isArray(req.body?.history) ? req.body.history : [];
    const history = rawHistory
      .filter((h) => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
      .slice(-10)
      .map((h) => ({ role: h.role, content: h.content.slice(0, 3500) }));

    if (!githubAi.isConfigured()) {
      return res.json({
        success: true,
        data: {
          reply: githubAi.localRetailReply(userMessage, chatSnapshot, { fallbackReason: 'not-configured' }),
          model: 'local-fallback',
          source: 'fallback',
        },
      });
    }

    const { reply, source } = await githubAi.askRetailAssistant(userMessage, chatSnapshot, history);

    res.json({
      success: true,
      data: {
        reply,
        model: source === 'fallback' ? 'local-fallback' : githubAi.getModel(),
        source,
      },
    });
  } catch (err) {
    console.error('AI chat error:', err.message);
    let chatSnapshot = {};
    try {
      chatSnapshot = compactSnapshotForChat(await buildStoreSnapshot());
    } catch (_) {
      /* ignore */
    }
    res.json({
      success: true,
      data: {
        reply: githubAi.localRetailReply(userMessage, chatSnapshot, { fallbackReason: 'error' }),
        model: 'local-fallback',
        source: 'fallback',
      },
    });
  }
};

module.exports = { getStatus, postChat, buildStoreSnapshot };
