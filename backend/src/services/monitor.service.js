const monitorRepo = require('../repositories/monitor.repository');
const { monitorQueue } = require('../queues');
const activityRepo = require('../repositories/activity.repository');

const scheduleMonitorJob = async (monitor) => {
  if (!monitor.active) return;
  const repeatOptions = {
    every: monitor.intervalMinutes * 60 * 1000,
  };
  await monitorQueue.add(
    `check-${monitor.id}`,
    { monitorId: monitor.id },
    { repeat: repeatOptions, jobId: `monitor-${monitor.id}` }
  );
};

const unscheduleMonitorJob = async (monitorId) => {
  const repeatableJobs = await monitorQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    if (job.id === `monitor-${monitorId}`) {
      await monitorQueue.removeRepeatableByKey(job.key);
    }
  }
};

const createMonitor = async (userId, data) => {
  const monitor = await monitorRepo.create({
    ...data,
    createdById: userId,
  });

  await scheduleMonitorJob(monitor);

  if (monitor.projectId) {
    await activityRepo.create({
      projectId: monitor.projectId,
      workspaceId: monitor.workspaceId,
      userId,
      type: 'MONITOR_CREATED',
      payload: { name: monitor.name, url: monitor.url },
    });
  }

  return monitor;
};

const getWorkspaceMonitors = async (workspaceId) => {
  return monitorRepo.findByWorkspace(workspaceId);
};

const getProjectMonitors = async (projectId) => {
  return monitorRepo.findByProject(projectId);
};

const getMonitorById = async (monitorId) => {
  const monitor = await monitorRepo.findById(monitorId);
  if (!monitor) {
    const err = new Error('Monitor not found');
    err.statusCode = 404;
    err.errorCode = 'MONITOR_NOT_FOUND';
    throw err;
  }
  return monitor;
};

const updateMonitor = async (monitorId, data) => {
  const updated = await monitorRepo.update(monitorId, data);

  await unscheduleMonitorJob(monitorId);
  if (updated.active) {
    await scheduleMonitorJob(updated);
  }

  return updated;
};

const toggleMonitor = async (monitorId) => {
  const monitor = await monitorRepo.findById(monitorId);
  if (!monitor) {
    const err = new Error('Monitor not found');
    err.statusCode = 404;
    err.errorCode = 'MONITOR_NOT_FOUND';
    throw err;
  }

  const updated = await monitorRepo.update(monitorId, { active: !monitor.active });

  if (updated.active) {
    await scheduleMonitorJob(updated);
  } else {
    await unscheduleMonitorJob(monitorId);
  }

  return updated;
};

const deleteMonitor = async (monitorId) => {
  await unscheduleMonitorJob(monitorId);
  return monitorRepo.remove(monitorId);
};

const getMonitorChecks = async (monitorId, limit) => {
  return monitorRepo.getChecks(monitorId, limit);
};

const getMonitorIncidents = async (monitorId, limit) => {
  return monitorRepo.getIncidents(monitorId, limit);
};

const initializeAllMonitors = async () => {
  const activeMonitors = await monitorRepo.findActive();
  for (const monitor of activeMonitors) {
    await scheduleMonitorJob(monitor);
  }
};

module.exports = {
  createMonitor,
  getWorkspaceMonitors,
  getProjectMonitors,
  getMonitorById,
  updateMonitor,
  toggleMonitor,
  deleteMonitor,
  getMonitorChecks,
  getMonitorIncidents,
  initializeAllMonitors,
};
