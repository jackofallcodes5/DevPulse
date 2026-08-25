const rateLimit = require('express-rate-limit');
const { getRedisClient } = require('../config/redis');

// Simple in-memory store fallback when Redis isn't available in tests
const createLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: options.message || 'Too many requests, please try again later.',
      errorCode: 'RATE_LIMIT_EXCEEDED',
    },
    skip: (req) => process.env.NODE_ENV === 'test',
  });
};

// General API rate limiter: 100 requests per minute
const defaultLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
});

// Auth rate limiter: 10 attempts per 15 minutes (stricter)
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again later.',
});

// Webhook rate limiter: 500 per minute (GitHub sends many events)
const webhookLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 500,
  message: 'Too many webhook requests.',
});

// Analytics rate limiter: 30 per minute (expensive queries)
const analyticsLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many analytics requests, please try again later.',
});

module.exports = {
  defaultLimiter,
  authLimiter,
  webhookLimiter,
  analyticsLimiter,
};
