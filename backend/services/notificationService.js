const admin = require('../config/firebase');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const logger = require('./logger');
const { logNotification } = require('./notificationLogger');

const sendPushNotification = async (tokens, title, body, data = {}) => {
  try {
    if (!tokens || tokens.length === 0) {
      logger.warn('[Notification] No tokens provided', { title });
      return;
    }

    const expoTokens = tokens.filter(t => t && typeof t === 'string' && t.startsWith('ExponentPushToken'));
    const fcmTokens = tokens.filter(t => t && typeof t === 'string' && !t.startsWith('ExponentPushToken'));

    if (expoTokens.length > 0) {
      await sendViaExpo(expoTokens, title, body, data);
    }

    if (fcmTokens.length > 0) {
      await sendViaFCM(fcmTokens, title, body, data);
    }

    if (expoTokens.length === 0 && fcmTokens.length === 0) {
      logger.warn('[Notification] No valid tokens found', { title });
      return;
    }

    await logNotification({
      recipientUid: data.recipientUid || null,
      title,
      body,
      type: data.type || 'unknown',
      status: 'sent',
      tokens,
    });
  } catch (error) {
    logger.error('[Notification] sendPushNotification failed', { error: error.message, title });
    await logNotification({
      recipientUid: data.recipientUid || null,
      title,
      body,
      type: data.type || 'unknown',
      status: 'failed',
      error: error.message,
      tokens,
    });
  }
};

const sendViaExpo = async (expoPushTokens, title, body, data = {}) => {
  try {
    const messages = expoPushTokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: {
        ...data,
        _deepLink: buildDeepLink(data),
      },
      priority: 'high',
      channelId: 'default',
    }));

    for (let i = 0; i < messages.length; i += 100) {
      const batch = messages.slice(i, i + 100);
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });
    const result = await response.json();
      logger.info('[Notification] Expo push result', { result });
    }
} catch (error) {
    logger.error('[Notification] Expo push error', { error: error.message });
  }
};

const sendViaFCM = async (fcmTokens, title, body, data = {}) => {
  try {
    const validTokens = fcmTokens.slice(0, 500);

    const message = {
      tokens: validTokens,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        _deepLink: buildDeepLink(data) || '',
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          sound: 'default',
        },
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
        payload: {
          aps: {
            sound: 'default',
            'content-available': 1,
          },
        },
      },
    };

    const response = await admin.messaging().sendMulticast(message);
logger.info('[Notification] FCM response', {
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

    if (response.failureCount > 0) {
      const failedTokens = response.responses
        .map((resp, idx) => (resp.error ? validTokens[idx] : null))
        .filter(Boolean);
      logger.warn('[Notification] FCM failed tokens', { count: failedTokens.length });
      const db = admin.firestore();
      for (const token of failedTokens) {
        const snap = await db.collection('users').where('expoPushToken', '==', token).get();
        snap.forEach(doc => doc.ref.update({ expoPushToken: null }));
      }
    }
} catch (error) {
    logger.error('[Notification] FCM push error', { error: error.message });
  }
};

const buildDeepLink = (data = {}) => {
  const { type, complaintId, itemId } = data;

  if (
    type === 'new_complaint' ||
    type === 'complaint_accepted' ||
    type === 'complaint_in_progress' ||
    type === 'complaint_completed' ||
    type === 'complaint_rejected' ||
    type === 'new_rating'
  ) {
    if (complaintId) return `unifix://complaint/${complaintId}`;
  }

if (type === 'new_lost_found') {
    return `unifix://lost-and-found?openTab=feed`;
  }

  if (type === 'item_handed_over') {
    return `unifix://lost-and-found?openTab=claims`;
  }

  if (type === 'lost_report_found') {
    return `unifix://lost-and-found?openTab=lost-history`;
  }

  if (type === 'new_lost_report') {
    return `unifix://lost-and-found?openTab=lostreports`;
  }

  return null;
};

const extractTokens = (data) => {
  const tokens = [];

  if (Array.isArray(data.pushToken)) {
    data.pushToken.forEach(t => {
      if (t && typeof t === 'string' && (t.startsWith('ExponentPushToken') || t.length > 50)) {
        tokens.push(t);
      }
    });
  } else if (data.pushToken && typeof data.pushToken === 'string' && 
    (data.pushToken.startsWith('ExponentPushToken') || data.pushToken.length > 50)) {
    tokens.push(data.pushToken);
  }

  if (Array.isArray(data.expoPushToken)) {
    data.expoPushToken.forEach(t => {
      if (t && typeof t === 'string' && t.startsWith('ExponentPushToken')) {
        tokens.push(t);
      }
    });
  } else if (
    data.expoPushToken &&
    typeof data.expoPushToken === 'string' &&
    data.expoPushToken.startsWith('ExponentPushToken')
  ) {
    tokens.push(data.expoPushToken);
  }

  return [...new Set(tokens)];
};

const getAllUserTokens = async (db, excludeUid = null) => {
  const snapshot = await db.collection('users').get();
  const tokens = [];

  snapshot.forEach(doc => {
    if (excludeUid && doc.id === excludeUid) return;
    const data = doc.data();
    tokens.push(...extractTokens(data));
  });

  return tokens;
};

const getTokensByRole = async (db, roles = [], excludeUid = null) => {
  const tokens = [];

  for (const role of roles) {
    let query = db.collection('users').where('role', '==', role);

    if (role === 'staff') {
      query = query.where('verificationStatus', '==', 'approved');
    }

    const snapshot = await query.get();

    snapshot.forEach(doc => {
      if (excludeUid && doc.id === excludeUid) return;
      const data = doc.data();
      tokens.push(...extractTokens(data));
    });
  }

  return tokens;
};

const getTokensByDesignation = async (db, designation, excludeUid = null, gender = null) => {
  let query = db
    .collection('users')
    .where('role', '==', 'staff')
    .where('designation', '==', designation)
    .where('verificationStatus', '==', 'approved');

  if (gender) {
    query = query.where('gender', '==', gender);
  }

  const snapshot = await query.get();
  const tokens = [];

  snapshot.forEach(doc => {
    if (excludeUid && doc.id === excludeUid) return;
    const data = doc.data();
    tokens.push(...extractTokens(data));
  });

  return tokens;
};

const getTokenForUid = async (db, uid) => {
  const doc = await db.collection('users').doc(uid).get();
  if (!doc.exists) return [];
  return extractTokens(doc.data());
};

module.exports = {
  sendPushNotification,
  getAllUserTokens,
  getTokensByRole,
  getTokensByDesignation,
  getTokenForUid,
};