const admin = require('../config/firebase');
const logger = require('./logger');

async function logNotification({ recipientUid, title, body, type, status, error = null, tokens = [] }) {
  try {
    await admin.firestore().collection('notificationLogs').add({
      recipientUid: recipientUid || null,
      title,
      body,
      type,
      status,
      error: error || null,
      tokenCount: tokens.length,
      sentAt: admin.firestore.Timestamp.now(),
    });
  } catch (err) {
    logger.error('[NotificationLogger] Failed to log notification', { error: err.message });
  }
}

module.exports = { logNotification };