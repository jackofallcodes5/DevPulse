const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const workspaceRoutes = require('./workspace.routes');
const projectRoutes = require('./project.routes');
const issueRoutes = require('./issue.routes');
const commentRoutes = require('./comment.routes');
const notificationRoutes = require('./notification.routes');
const githubRoutes = require('./github.routes');
const webhookRoutes = require('./webhook.routes');
const monitorRoutes = require('./monitor.routes');
const analyticsRoutes = require('./analytics.routes');
const activityRoutes = require('./activity.routes');

router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/projects', projectRoutes);
router.use('/', issueRoutes);
router.use('/', commentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/github', githubRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/monitors', monitorRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/activity', activityRoutes);

module.exports = router;
