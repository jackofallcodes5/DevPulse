const { Queue } = require('bullmq');
const { getRedisClient } = require('../config/redis');

const connection = getRedisClient();

const githubEventQueue = new Queue('github-events', { connection });
const monitorQueue = new Queue('monitor-checks', { connection });
const notificationQueue = new Queue('notifications', { connection });

module.exports = {
  githubEventQueue,
  monitorQueue,
  notificationQueue,
};
