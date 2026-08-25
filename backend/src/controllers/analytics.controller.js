const analyticsService = require('../services/analytics.service');
const { successResponse } = require('../utils/apiResponse');

const getProjectAnalytics = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getProjectAnalytics(req.params.id);
    return successResponse(res, { analytics });
  } catch (err) {
    return next(err);
  }
};

const getMonitoringAnalytics = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getMonitoringAnalytics(req.params.id);
    return successResponse(res, { analytics });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getProjectAnalytics,
  getMonitoringAnalytics,
};
