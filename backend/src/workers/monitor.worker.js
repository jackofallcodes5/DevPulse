const { Worker } = require('bullmq');
const axios = require('axios');
const { getRedisClient } = require('../config/redis');
const monitorRepo = require('../repositories/monitor.repository');
const activityRepo = require('../repositories/activity.repository');
const notificationRepo = require('../repositories/notification.repository');
const { getIO } = require('../websockets');
const logger = require('../utils/logger');

const connection = getRedisClient();

const executeMonitorCheck = async (job) => {
  const { monitorId } = job.data;
  const monitor = await monitorRepo.findById(monitorId);

  if (!monitor || !monitor.active) {
    return;
  }

  const startTime = Date.now();
  let success = false;
  let statusCode = null;
  let errorMsg = null;
  let responseTimeMs = null;

  try {
    const response = await axios({
      method: monitor.method,
      url: monitor.url,
      timeout: monitor.timeoutSeconds * 1000,
      validateStatus: () => true, // Don't throw on error HTTP codes
    });

    responseTimeMs = Date.now() - startTime;
    statusCode = response.status;
    success = statusCode === monitor.expectedStatus;

    if (!success) {
      errorMsg = `Expected HTTP ${monitor.expectedStatus}, got ${statusCode}`;
    }
  } catch (err) {
    responseTimeMs = Date.now() - startTime;
    success = false;
    errorMsg = err.message || 'Network error / Timeout';
  }

  const check = await monitorRepo.recordCheck(monitor.id, {
    success,
    statusCode,
    responseTimeMs,
    error: errorMsg,
    checkedAt: new Date(),
  });

  const openIncident = await monitorRepo.findOpenIncident(monitor.id);

  if (!success && !openIncident) {
    // Open new incident
    const incident = await monitorRepo.createIncident(monitor.id, errorMsg);

    if (monitor.projectId) {
      const activity = await activityRepo.create({
        projectId: monitor.projectId,
        workspaceId: monitor.workspaceId,
        type: 'MONITOR_INCIDENT_OPENED',
        payload: {
          monitorId: monitor.id,
          monitorName: monitor.name,
          reason: errorMsg,
        },
      });

      const io = getIO();
      if (io) {
        io.to(`project:${monitor.projectId}`).emit('activity:created', activity);
      }
    }

    // Notify workspace owner/creator
    const notif = await notificationRepo.create({
      userId: monitor.createdById,
      type: 'MONITORING_FAILURE',
      title: `Incident: ${monitor.name} is DOWN`,
      message: `Monitor ${monitor.name} failed health check: ${errorMsg}`,
      metadata: { monitorId: monitor.id, incidentId: incident.id },
    });

    const io = getIO();
    if (io) {
      io.to(`workspace:${monitor.workspaceId}`).emit('monitor:incident', {
        monitorId: monitor.id,
        status: 'DOWN',
        incident,
      });
      io.to(`user:${monitor.createdById}`).emit('notification:created', notif);
    }
  } else if (success && openIncident) {
    // Resolve existing incident
    const resolvedIncident = await monitorRepo.resolveIncident(openIncident.id);

    if (monitor.projectId) {
      const activity = await activityRepo.create({
        projectId: monitor.projectId,
        workspaceId: monitor.workspaceId,
        type: 'MONITOR_INCIDENT_RESOLVED',
        payload: {
          monitorId: monitor.id,
          monitorName: monitor.name,
          durationMs: new Date() - new Date(openIncident.startedAt),
        },
      });

      const io = getIO();
      if (io) {
        io.to(`project:${monitor.projectId}`).emit('activity:created', activity);
      }
    }

    const notif = await notificationRepo.create({
      userId: monitor.createdById,
      type: 'MONITORING_RECOVERY',
      title: `Resolved: ${monitor.name} is UP`,
      message: `Monitor ${monitor.name} has recovered and is returning HTTP ${statusCode}`,
      metadata: { monitorId: monitor.id, incidentId: resolvedIncident.id },
    });

    const io = getIO();
    if (io) {
      io.to(`workspace:${monitor.workspaceId}`).emit('monitor:incident', {
        monitorId: monitor.id,
        status: 'UP',
        incident: resolvedIncident,
      });
      io.to(`user:${monitor.createdById}`).emit('notification:created', notif);
    }
  }

  // Emit live check event
  const io = getIO();
  if (io) {
    io.to(`workspace:${monitor.workspaceId}`).emit('monitor:check', {
      monitorId: monitor.id,
      check,
    });
  }
};

const monitorWorker = process.env.NODE_ENV !== 'test'
  ? new Worker('monitor-checks', executeMonitorCheck, { connection, concurrency: 10 })
  : null;

module.exports = { monitorWorker, executeMonitorCheck };
