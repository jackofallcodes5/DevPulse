const analyticsRepo = require('../repositories/analytics.repository');

const getProjectAnalytics = async (projectId) => {
  return analyticsRepo.getProjectAnalytics(projectId);
};

const getMonitoringAnalytics = async (monitorId) => {
  return analyticsRepo.getMonitoringAnalytics(monitorId);
};

module.exports = {
  getProjectAnalytics,
  getMonitoringAnalytics,
};
