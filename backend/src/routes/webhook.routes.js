const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');
const { webhookLimiter } = require('../middleware/rateLimiter');

// POST /api/webhooks/github — Note: raw body is captured in index.js for signature verification
router.post('/github', webhookLimiter, webhookController.handleGitHubWebhook);

module.exports = router;
