require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./src/config/db');
const { initFirebaseAdmin } = require('./src/config/firebase');
const errorHandler = require('./src/middleware/errorHandler');

const authRoutes = require('./src/routes/auth.routes');
const productRoutes = require('./src/routes/product.routes');
const categoryRoutes = require('./src/routes/category.routes');
const saleRoutes = require('./src/routes/sale.routes');
const inventoryRoutes = require('./src/routes/inventory.routes');
const customerRoutes = require('./src/routes/customer.routes');
const employeeRoutes = require('./src/routes/employee.routes');
const supplierRoutes = require('./src/routes/supplier.routes');
const branchRoutes = require('./src/routes/branch.routes');
const reportRoutes = require('./src/routes/report.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');
const aiRoutes = require('./src/routes/ai.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const settingsRoutes = require('./src/routes/settings.routes');
const whatsappRoutes = require('./src/routes/whatsapp.routes');

let appInstance = null;

async function createApp() {
  if (appInstance) return appInstance;

  await connectDB();
  initFirebaseAdmin();

  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  const corsOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    /^https:\/\/.*\.vercel\.app$/,
  ];

  app.use(cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const allowed = corsOrigins.some((o) =>
        typeof o === 'string' ? o === origin : o.test(origin)
      );
      callback(allowed ? null : new Error('Not allowed by CORS'), allowed);
    },
    credentials: true,
  }));

  app.use(morgan(process.env.VERCEL ? 'combined' : 'dev'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (!process.env.VERCEL) {
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  }

  app.get('/api/health', (_, res) => {
    res.json({ success: true, message: 'TrendyPOS AI API is running', version: '1.0.0' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/sales', saleRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/employees', employeeRoutes);
  app.use('/api/suppliers', supplierRoutes);
  app.use('/api/branches', branchRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/whatsapp', whatsappRoutes);

  app.use(errorHandler);

  appInstance = app;
  return app;
}

module.exports = { createApp };
