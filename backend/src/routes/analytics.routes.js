const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth');
const { analyticsLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);
router.use(analyticsLimiter);

router.get('/project/:id', analyticsController.getProjectAnalytics);
router.get('/monitoring/:id', analyticsController.getMonitoringAnalytics);

module.exports = router;
