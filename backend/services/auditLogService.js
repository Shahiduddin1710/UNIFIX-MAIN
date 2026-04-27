const admin = require('../config/firebase');
const logger = require('./logger');

async function createAuditLog({ action, performedBy, performedByRole, targetId, targetType, metadata = {} }) {
  try {
    await admin.firestore().collection('auditLogs').add({
      action,
      performedBy,
      performedByRole,
      targetId: targetId || null,
      targetType: targetType || null,
      metadata,
      timestamp: admin.firestore.Timestamp.now(),
    });
  } catch (err) {
    logger.error('[AuditLog] Failed to write audit log', { action, performedBy, error: err.message });
  }
}

module.exports = { createAuditLog };