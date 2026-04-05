// Application Insights - must be initialized before other imports
const appInsights = require('applicationinsights');
if (process.env.APPINSIGHTS_CONNECTION_STRING) {
  appInsights.setup(process.env.APPINSIGHTS_CONNECTION_STRING)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true, true)
    .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
    .setSendLiveMetrics(true)
    .start();
  console.log('Application Insights initialized');
}

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { loadSecrets } = require('./config/keyvault');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy headers (required behind Azure Container Apps / nginx reverse proxy)
app.set('trust proxy', true);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined'));

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use(globalLimiter);

// Service URLs
const services = {
  users: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  products: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
  orders: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
  notifications: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004'
};

// Health check for gateway itself
app.get('/health', (req, res) => {
  res.json({
    service: 'api-gateway',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: Object.keys(services)
  });
});

// Proxy configuration helper
// Note: When Express mounts middleware on a path like '/api/auth',
// it strips the mount path from req.url. So we need pathRewrite
// to prepend the original prefix back before forwarding.
const createProxy = (target, prefix) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path) => `${prefix}${path}`,
    on: {
      error: (err, req, res) => {
        console.error(`Proxy error for ${target}:`, err.message);
        res.status(503).json({ error: 'Service unavailable' });
      }
    }
  });
};

// Route to User Service
app.use('/api/auth', createProxy(services.users, '/api/auth'));
app.use('/api/users', createProxy(services.users, '/api/users'));

// Route to Product Service
app.use('/api/products', createProxy(services.products, '/api/products'));

// Route to Order Service
app.use('/api/orders', createProxy(services.orders, '/api/orders'));

// Route to Notification Service
app.use('/api/notifications', createProxy(services.notifications, '/api/notifications'));

// Service health endpoints
app.use('/health/users', createProxy(services.users, '/health'));
app.use('/health/products', createProxy(services.products, '/health'));
app.use('/health/orders', createProxy(services.orders, '/health'));
app.use('/health/notifications', createProxy(services.notifications, '/health'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, async () => {
  // Load secrets from Key Vault (if configured)
  await loadSecrets();

  console.log(`API Gateway running on port ${PORT}`);
  console.log('Proxying to services:');
  Object.entries(services).forEach(([name, url]) => {
    console.log(`  ${name}: ${url}`);
  });
});

module.exports = app;
