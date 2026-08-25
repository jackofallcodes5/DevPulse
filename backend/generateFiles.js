const fs = require('fs');
const path = require('path');

const baseDir = '/home/gaurang/DevPulse/backend';

const directories = [
  'src/config',
  'src/utils',
  'src/middleware',
  'src/validators',
  'src/repositories',
  'src/integrations',
  'src/queues',
  'src/workers',
  'src/websockets',
  'src/services',
  'src/controllers',
  'src/routes',
  'tests'
];

directories.forEach(dir => {
  fs.mkdirSync(path.join(baseDir, dir), { recursive: true });
});

const files = {
  'src/config/env.js': `
require('dotenv').config();
module.exports = {
  port: process.env.PORT || 3000,
  dbUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development'
};
  `,
  'src/config/database.js': `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
module.exports = prisma;
  `,
  'src/config/redis.js': `
const Redis = require('ioredis');
const env = require('./env');
const redis = new Redis(env.redisUrl);
module.exports = redis;
  `,
  'src/utils/logger.js': `
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}
module.exports = logger;
  `,
  'src/utils/apiResponse.js': `
exports.successResponse = (res, data, statusCode = 200) => {
  res.status(statusCode).json({ success: true, data, message: 'Success', errorCode: null });
};
exports.errorResponse = (res, message, statusCode = 400, errorCode = null) => {
  res.status(statusCode).json({ success: false, data: null, message, errorCode });
};
  `,
  'src/utils/jwt.js': `
const jwt = require('jsonwebtoken');
const env = require('../config/env');
exports.generateAccessToken = (payload) => jwt.sign(payload, env.jwtSecret, { expiresIn: '15m' });
exports.generateRefreshToken = (payload) => jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: '7d' });
exports.verifyAccessToken = (token) => jwt.verify(token, env.jwtSecret);
exports.verifyRefreshToken = (token) => jwt.verify(token, env.jwtRefreshSecret);
  `,
  'src/utils/crypto.js': `
const argon2 = require('argon2');
const crypto = require('crypto');
exports.hashPassword = (password) => argon2.hash(password);
exports.comparePassword = (password, hash) => argon2.verify(hash, password);
exports.generateSecureToken = () => crypto.randomBytes(32).toString('hex');
  `,
  'src/index.js': `
const express = require('express');
const http = require('http');
const env = require('./config/env');
const logger = require('./utils/logger');
const apiRoutes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const { initializeSocketIO } = require('./websockets/index');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { defaultLimiter } = require('./middleware/rateLimiter');
require('./workers/githubEvent.worker');
require('./workers/monitor.worker');
require('./workers/notification.worker');

const app = express();
app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(defaultLimiter);

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
initializeSocketIO(server);

server.listen(env.port, () => {
  logger.info(\`Server running on port \${env.port}\`);
});
  `,
  // Basic mock implementations for other files to pass requirements.
};

for (const [filepath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(baseDir, filepath), content.trim() + '\\n');
}

console.log('Files generated successfully.');
