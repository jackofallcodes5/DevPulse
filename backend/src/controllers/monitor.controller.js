const monitorService = require('../services/monitor.service');
const { successResponse } = require('../utils/apiResponse');

const createMonitor = async (req, res, next) => {
  try {
    const monitor = await monitorService.createMonitor(req.user.id, req.body);
    return successResponse(res, { monitor }, 201, 'Monitor created successfully');
  } catch (err) {
    return next(err);
  }
};

const getMonitors = async (req, res, next) => {
  try {
    const { workspaceId, projectId } = req.query;
    let monitors = [];
    if (projectId) {
      monitors = await monitorService.getProjectMonitors(projectId);
    } else if (workspaceId) {
      monitors = await monitorService.getWorkspaceMonitors(workspaceId);
    }
    return successResponse(res, { monitors });
  } catch (err) {
    return next(err);
  }
};

const getMonitorById = async (req, res, next) => {
  try {
    const monitor = await monitorService.getMonitorById(req.params.id);
    return successResponse(res, { monitor });
  } catch (err) {
    return next(err);
  }
};

const updateMonitor = async (req, res, next) => {
  try {
    const monitor = await monitorService.updateMonitor(req.params.id, req.body);
    return successResponse(res, { monitor }, 200, 'Monitor updated successfully');
  } catch (err) {
    return next(err);
  }
};

const toggleMonitor = async (req, res, next) => {
  try {
    const monitor = await monitorService.toggleMonitor(req.params.id);
    return successResponse(res, { monitor }, 200, `Monitor ${monitor.active ? 'activated' : 'deactivated'}`);
  } catch (err) {
    return next(err);
  }
};

const deleteMonitor = async (req, res, next) => {
  try {
    await monitorService.deleteMonitor(req.params.id);
    return successResponse(res, null, 200, 'Monitor deleted successfully');
  } catch (err) {
    return next(err);
  }
};

const getChecks = async (req, res, next) => {
  try {
    const checks = await monitorService.getMonitorChecks(req.params.id, parseInt(req.query.limit, 10) || 100);
    return successResponse(res, { checks });
  } catch (err) {
    return next(err);
  }
};

const getIncidents = async (req, res, next) => {
  try {
    const incidents = await monitorService.getMonitorIncidents(req.params.id, parseInt(req.query.limit, 10) || 50);
    return successResponse(res, { incidents });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  createMonitor,
  getMonitors,
  getMonitorById,
  updateMonitor,
  toggleMonitor,
  deleteMonitor,
  getChecks,
  getIncidents,
};
