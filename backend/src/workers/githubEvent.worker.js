const { Worker } = require('bullmq');
const { getRedisClient } = require('../config/redis');
const githubRepo = require('../repositories/github.repository');
const issueRepo = require('../repositories/issue.repository');
const activityRepo = require('../repositories/activity.repository');
const notificationRepo = require('../repositories/notification.repository');
const { parseIssueReferences } = require('../integrations/github');
const { getIO } = require('../websockets');
const logger = require('../utils/logger');

const connection = getRedisClient();

const processGitHubEvent = async (job) => {
  const { eventId, eventType, payload } = job.data;

  try {
    logger.info(`Processing GitHub event: ${eventType}`, { eventId });

    if (eventType === 'push') {
      const repoGithubId = payload.repository?.id;
      const repo = await githubRepo.findRepoByGithubId(repoGithubId);

      if (repo) {
        const commits = payload.commits || [];
        for (const commitData of commits) {
          const issueNumbers = parseIssueReferences(commitData.message);
          let linkedIssueId = null;

          if (issueNumbers.length > 0 && repo.projectId) {
            const firstIssueNum = issueNumbers[0];
            const issue = await issueRepo.findByProjectAndNumber(repo.projectId, firstIssueNum);
            if (issue) {
              linkedIssueId = issue.id;

              // Create notification for assignee
              if (issue.assigneeId) {
                const notif = await notificationRepo.create({
                  userId: issue.assigneeId,
                  type: 'GITHUB_COMMIT',
                  title: `New commit linked to #${issue.number}`,
                  message: `${commitData.author?.name || 'Developer'} pushed commit "${commitData.message.slice(0, 50)}" linking #${issue.number}`,
                  metadata: { issueId: issue.id, sha: commitData.id, url: commitData.url },
                });

                const io = getIO();
                if (io) {
                  io.to(`user:${issue.assigneeId}`).emit('notification:created', notif);
                }
              }
            }
          }

          const savedCommit = await githubRepo.upsertCommit({
            sha: commitData.id,
            message: commitData.message,
            authorName: commitData.author?.name || 'Unknown',
            authorEmail: commitData.author?.email || 'unknown@github.com',
            authoredAt: new Date(commitData.timestamp || Date.now()),
            url: commitData.url,
            repositoryId: repo.id,
            projectId: repo.projectId,
            issueId: linkedIssueId,
            pushedAt: new Date(),
          });

          // Emit real-time commit event
          const io = getIO();
          if (io && repo.projectId) {
            io.to(`project:${repo.projectId}`).emit('github:commit', savedCommit);
          }
        }

        if (repo.projectId) {
          const activity = await activityRepo.create({
            projectId: repo.projectId,
            type: 'GITHUB_PUSH',
            payload: {
              pusher: payload.pusher?.name || 'Developer',
              commitsCount: commits.length,
              ref: payload.ref,
              repoName: repo.name,
            },
          });

          const io = getIO();
          if (io) {
            io.to(`project:${repo.projectId}`).emit('activity:created', activity);
          }
        }
      }
    } else if (eventType === 'pull_request') {
      const prData = payload.pull_request;
      const repoGithubId = payload.repository?.id;
      const repo = await githubRepo.findRepoByGithubId(repoGithubId);

      if (repo && prData) {
        const savedPR = await githubRepo.upsertPullRequest({
          githubId: prData.id,
          number: prData.number,
          title: prData.title,
          state: prData.state,
          body: prData.body,
          url: prData.html_url,
          authorLogin: prData.user?.login || 'unknown',
          authorAvatarUrl: prData.user?.avatar_url,
          merged: prData.merged || false,
          mergedAt: prData.merged_at ? new Date(prData.merged_at) : null,
          repositoryId: repo.id,
          projectId: repo.projectId,
          githubCreatedAt: new Date(prData.created_at),
          githubUpdatedAt: new Date(prData.updated_at),
        });

        if (repo.projectId) {
          const activity = await activityRepo.create({
            projectId: repo.projectId,
            type: 'GITHUB_PR',
            payload: {
              action: payload.action,
              title: prData.title,
              number: prData.number,
              url: prData.html_url,
              author: prData.user?.login,
            },
          });

          const io = getIO();
          if (io) {
            io.to(`project:${repo.projectId}`).emit('github:pr', savedPR);
            io.to(`project:${repo.projectId}`).emit('activity:created', activity);
          }
        }
      }
    }

    await githubRepo.markEventProcessed(eventId);
    logger.info(`Completed processing GitHub event`, { eventId });
  } catch (err) {
    logger.error('Failed to process GitHub event in worker', { error: err.message, eventId });
    throw err;
  }
};

const githubWorker = process.env.NODE_ENV !== 'test'
  ? new Worker('github-events', processGitHubEvent, { connection, concurrency: 5 })
  : null;

module.exports = { githubWorker, processGitHubEvent };
