const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/project/:projectId', activityController.getProjectActivity);

module.exports = router;
