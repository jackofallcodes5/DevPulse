const { Worker } = require('bullmq');
const { getRedisClient } = require('../config/redis');
const notificationRepo = require('../repositories/notification.repository');
const { getIO } = require('../websockets');
const logger = require('../utils/logger');

const connection = getRedisClient();

const sendNotificationJob = async (job) => {
  const { userId, type, title, message, metadata } = job.data;

  const notif = await notificationRepo.create({
    userId,
    type,
    title,
    message,
    metadata,
  });

  const io = getIO();
  if (io) {
    io.to(`user:${userId}`).emit('notification:created', notif);
  }

  logger.info(`Notification delivered to user:${userId}`, { notifId: notif.id, type });
};

const notificationWorker = process.env.NODE_ENV !== 'test'
  ? new Worker('notifications', sendNotificationJob, { connection, concurrency: 5 })
  : null;

module.exports = { notificationWorker, sendNotificationJob };
