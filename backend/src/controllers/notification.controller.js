const notificationService = require('../services/notification.service');
const { successResponse } = require('../utils/apiResponse');

const getNotifications = async (req, res, next) => {
  try {
    const { notifications, unreadCount } = await notificationService.getUserNotifications(req.user.id, req.query);
    return successResponse(res, { notifications, unreadCount });
  } catch (err) {
    return next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markNotificationRead(req.params.id, req.user.id);
    return successResponse(res, { notification });
  } catch (err) {
    return next(err);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await notificationService.markAllNotificationsRead(req.user.id);
    return successResponse(res, null, 200, 'All notifications marked as read');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getNotifications,
  markRead,
  markAllRead,
};
