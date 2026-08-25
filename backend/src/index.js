require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const config = require('./config/env');
const logger = require('./utils/logger');
const { initializeSchema } = require('./config/database');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const { defaultLimiter } = require('./middleware/rateLimiter');
const { initializeSocketIO } = require('./websockets');
const monitorService = require('./services/monitor.service');

// Import workers so they register with BullMQ
if (process.env.NODE_ENV !== 'test') {
  require('./workers/githubEvent.worker');
  require('./workers/monitor.worker');
  require('./workers/notification.worker');
}

const app = express();

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Hub-Signature-256', 'X-GitHub-Delivery', 'X-GitHub-Event'],
  })
);

// HTTP request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
}

// Cookie parser
app.use(cookieParser());

// Raw body parser for webhook signature verification
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Default rate limiter
app.use('/api', defaultLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount API routes
app.use('/api', routes);

// 404 handler
app.use(notFound);

// Central error handler
app.use(errorHandler);

const server = http.createServer(app);

// Initialize Socket.IO
initializeSocketIO(server);

// Start server, initialize MySQL schema, and start background monitoring workers
if (process.env.NODE_ENV !== 'test') {
  server.listen(config.port, async () => {
    logger.info(`DevPulse Backend API running on port ${config.port} (${config.nodeEnv})`);

    try {
      await initializeSchema();
      await monitorService.initializeAllMonitors();
      logger.info('MySQL Schema and API Monitoring workers initialized');
    } catch (err) {
      logger.error('Failed to initialize server background tasks', { error: err.message });
    }
  });
}

module.exports = { app, server };
