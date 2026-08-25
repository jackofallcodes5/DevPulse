const notificationRepo = require('../repositories/notification.repository');

const getUserNotifications = async (userId, options) => {
  const [notifications, unreadCount] = await Promise.all([
    notificationRepo.findByUser(userId, options),
    notificationRepo.getUnreadCount(userId),
  ]);
  return { notifications, unreadCount };
};

const markNotificationRead = async (notificationId, userId) => {
  return notificationRepo.markRead(notificationId, userId);
};

const markAllNotificationsRead = async (userId) => {
  await notificationRepo.markAllRead(userId);
  return { success: true };
};

module.exports = {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
