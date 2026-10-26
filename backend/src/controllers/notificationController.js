const dbService = require("../services/dbService");

async function getNotifications(req, res, next) {
  try {
    const notifications = await dbService.getNotifications(req.user.id);
    res.json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
}

async function markAsRead(req, res, next) {
  try {
    await dbService.markNotificationRead(req.params.id, req.user.id);
    res.json({ success: true, message: "Notification marked as read." });
  } catch (error) {
    next(error);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    await dbService.markAllNotificationsRead(req.user.id);
    res.json({ success: true, message: "All notifications marked as read." });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
