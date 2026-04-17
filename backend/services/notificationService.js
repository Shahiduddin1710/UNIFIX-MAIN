const admin = require('../config/firebase');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const sendPushNotification = async (tokens, title, body, data = {}) => {
  try {
    if (!tokens || tokens.length === 0) {
      console.log('No tokens provided');
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
      console.log('No valid tokens found'); 
    }
  } catch (error) {
    console.error('Push notification error:', error.message);
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
      console.log('Expo push result:', JSON.stringify(result));
    }
  } catch (error) {
    console.error('Expo push error:', error.message);
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
    console.log('FCM response:', {
      successCount: response.successCount,
      failureCount: response.failureCount,
      failedTokens: response.responses
        .map((resp, idx) => ({ token: validTokens[idx], error: resp.error?.message }))
        .filter(r => r.error),
    });

    if (response.failureCount > 0) {
      const failedTokens = response.responses
        .map((resp, idx) => (resp.error ? validTokens[idx] : null))
        .filter(Boolean);
      console.log('Failed tokens to remove:', failedTokens);
    }
  } catch (error) {
    console.error('FCM push error:', error.message);
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
    if (itemId) return `unifix://lost-found/${itemId}`;
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