const commentRepo = require('../repositories/comment.repository');
const issueRepo = require('../repositories/issue.repository');
const userRepo = require('../repositories/user.repository');
const notificationRepo = require('../repositories/notification.repository');
const activityRepo = require('../repositories/activity.repository');
const { getIO } = require('../websockets');

const parseMentions = (body) => {
  if (!body) return [];
  const regex = /@([a-zA-Z0-9_-]+)/g;
  const mentions = new Set();
  let match;
  while ((match = regex.exec(body)) !== null) {
    mentions.add(match[1]);
  }
  return Array.from(mentions);
};

const createComment = async (issueId, authorId, body) => {
  const issue = await issueRepo.findById(issueId);
  if (!issue) {
    const err = new Error('Issue not found');
    err.statusCode = 404;
    err.errorCode = 'ISSUE_NOT_FOUND';
    throw err;
  }

  const comment = await commentRepo.create(issueId, authorId, body);

  // Activity
  const activity = await activityRepo.create({
    projectId: issue.projectId,
    userId: authorId,
    type: 'COMMENT_CREATED',
    payload: {
      issueId,
      issueNumber: issue.number,
      commentId: comment.id,
      authorName: comment.author.name,
    },
  });

  // Handle @mentions
  const mentionedUsernames = parseMentions(body);
  if (mentionedUsernames.length > 0) {
    for (const username of mentionedUsernames) {
      const user = await userRepo.findByUsername(username);
      if (user && user.id !== authorId) {
        const notif = await notificationRepo.create({
          userId: user.id,
          type: 'USER_MENTION',
          title: `Mentioned in Issue #${issue.number}`,
          message: `${comment.author.name} mentioned you in "${issue.title}": "${body.slice(0, 80)}..."`,
          metadata: { issueId, commentId: comment.id, projectId: issue.projectId },
        });

        const io = getIO();
        if (io) {
          io.to(`user:${user.id}`).emit('notification:created', notif);
        }
      }
    }
  }

  // Notify assignee if not author and not mentioned separately
  if (issue.assigneeId && issue.assigneeId !== authorId) {
    const notif = await notificationRepo.create({
      userId: issue.assigneeId,
      type: 'ISSUE_COMMENT',
      title: `New comment on Issue #${issue.number}`,
      message: `${comment.author.name} commented on "${issue.title}"`,
      metadata: { issueId, commentId: comment.id, projectId: issue.projectId },
    });

    const io = getIO();
    if (io) {
      io.to(`user:${issue.assigneeId}`).emit('notification:created', notif);
    }
  }

  const io = getIO();
  if (io) {
    io.to(`project:${issue.projectId}`).emit('comment:created', comment);
    io.to(`project:${issue.projectId}`).emit('activity:created', activity);
  }

  return comment;
};

const getIssueComments = async (issueId) => {
  return commentRepo.findByIssue(issueId);
};

const updateComment = async (commentId, authorId, body) => {
  const comment = await commentRepo.findById(commentId);
  if (!comment) {
    const err = new Error('Comment not found');
    err.statusCode = 404;
    err.errorCode = 'COMMENT_NOT_FOUND';
    throw err;
  }

  if (comment.authorId !== authorId) {
    const err = new Error('You can only edit your own comments');
    err.statusCode = 403;
    err.errorCode = 'UNAUTHORIZED_COMMENT_EDIT';
    throw err;
  }

  const updated = await commentRepo.update(commentId, body);

  const issue = await issueRepo.findById(comment.issueId);
  const io = getIO();
  if (io && issue) {
    io.to(`project:${issue.projectId}`).emit('comment:updated', updated);
  }

  return updated;
};

const deleteComment = async (commentId, authorId) => {
  const comment = await commentRepo.findById(commentId);
  if (!comment) {
    const err = new Error('Comment not found');
    err.statusCode = 404;
    err.errorCode = 'COMMENT_NOT_FOUND';
    throw err;
  }

  if (comment.authorId !== authorId) {
    const err = new Error('You can only delete your own comments');
    err.statusCode = 403;
    err.errorCode = 'UNAUTHORIZED_COMMENT_DELETE';
    throw err;
  }

  await commentRepo.remove(commentId);

  const issue = await issueRepo.findById(comment.issueId);
  const io = getIO();
  if (io && issue) {
    io.to(`project:${issue.projectId}`).emit('comment:deleted', { commentId });
  }

  return { success: true };
};

module.exports = {
  createComment,
  getIssueComments,
  updateComment,
  deleteComment,
};
