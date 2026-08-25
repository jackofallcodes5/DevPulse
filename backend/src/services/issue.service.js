const issueRepo = require('../repositories/issue.repository');
const activityRepo = require('../repositories/activity.repository');
const notificationRepo = require('../repositories/notification.repository');
const { getIO } = require('../websockets');

const createIssue = async (projectId, userId, data) => {
  const issue = await issueRepo.create(projectId, data, userId);

  await activityRepo.create({
    projectId,
    userId,
    type: 'ISSUE_CREATED',
    payload: {
      issueId: issue.id,
      number: issue.number,
      title: issue.title,
      status: issue.status,
    },
  });

  // Notify assignee if assigned
  if (data.assigneeId && data.assigneeId !== userId) {
    const notif = await notificationRepo.create({
      userId: data.assigneeId,
      type: 'ISSUE_ASSIGNED',
      title: `Assigned to Issue #${issue.number}`,
      message: `You were assigned to "${issue.title}"`,
      metadata: { issueId: issue.id, projectId },
    });

    const io = getIO();
    if (io) {
      io.to(`user:${data.assigneeId}`).emit('notification:created', notif);
    }
  }

  const io = getIO();
  if (io) {
    io.to(`project:${projectId}`).emit('issue:created', issue);
  }

  return issue;
};

const getProjectIssues = async (projectId, filters) => {
  return issueRepo.findByProject(projectId, filters);
};

const getIssueById = async (issueId) => {
  const issue = await issueRepo.findById(issueId);
  if (!issue) {
    const err = new Error('Issue not found');
    err.statusCode = 404;
    err.errorCode = 'ISSUE_NOT_FOUND';
    throw err;
  }
  return issue;
};

const updateIssue = async (issueId, userId, data) => {
  const oldIssue = await issueRepo.findById(issueId);
  if (!oldIssue) {
    const err = new Error('Issue not found');
    err.statusCode = 404;
    err.errorCode = 'ISSUE_NOT_FOUND';
    throw err;
  }

  const updatedIssue = await issueRepo.update(issueId, data);

  // Status changed activity
  if (data.status && data.status !== oldIssue.status) {
    const activity = await activityRepo.create({
      projectId: oldIssue.projectId,
      userId,
      type: 'ISSUE_STATUS_CHANGED',
      payload: {
        issueId: updatedIssue.id,
        number: updatedIssue.number,
        title: updatedIssue.title,
        fromStatus: oldIssue.status,
        toStatus: data.status,
      },
    });

    const io = getIO();
    if (io) {
      io.to(`project:${oldIssue.projectId}`).emit('activity:created', activity);
    }
  }

  // Assignee changed notification
  if (data.assigneeId && data.assigneeId !== oldIssue.assigneeId && data.assigneeId !== userId) {
    const notif = await notificationRepo.create({
      userId: data.assigneeId,
      type: 'ISSUE_ASSIGNED',
      title: `Assigned to Issue #${updatedIssue.number}`,
      message: `You were assigned to "${updatedIssue.title}"`,
      metadata: { issueId: updatedIssue.id, projectId: oldIssue.projectId },
    });

    const io = getIO();
    if (io) {
      io.to(`user:${data.assigneeId}`).emit('notification:created', notif);
    }
  }

  const io = getIO();
  if (io) {
    io.to(`project:${oldIssue.projectId}`).emit('issue:updated', updatedIssue);
  }

  return updatedIssue;
};

const deleteIssue = async (issueId, userId) => {
  const issue = await issueRepo.findById(issueId);
  if (!issue) {
    const err = new Error('Issue not found');
    err.statusCode = 404;
    err.errorCode = 'ISSUE_NOT_FOUND';
    throw err;
  }

  await issueRepo.remove(issueId);

  const io = getIO();
  if (io) {
    io.to(`project:${issue.projectId}`).emit('issue:deleted', { issueId });
  }

  return { success: true };
};

const getKanbanBoard = async (projectId) => {
  return issueRepo.getKanbanByProject(projectId);
};

module.exports = {
  createIssue,
  getProjectIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
  getKanbanBoard,
};
