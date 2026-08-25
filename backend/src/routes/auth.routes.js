const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerSchema, loginSchema } = require('../validators/auth.validators');

router.post('/register', authLimiter, validate({ body: registerSchema }), authController.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);

// GitHub OAuth
router.get('/github', authController.githubOAuthRedirect);
router.get('/github/callback', optionalAuth, authController.githubCallback);

module.exports = router;
