const axios = require('axios');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const sendPushNotification = async (expoPushTokens, title, body, data = {}) => {
  try {
    const tokens = Array.isArray(expoPushTokens) ? expoPushTokens : [expoPushTokens];
    const validTokens = tokens.filter(t => t && typeof t === 'string' && t.startsWith('ExponentPushToken'));
    if (validTokens.length === 0) return;

    const messages = validTokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId: 'default',
    }));

    const chunks = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }

    for (const chunk of chunks) {
      await axios.post(EXPO_PUSH_URL, chunk, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    console.error('Push notification error:', error.message);
  }
};

const getAllUserTokens = async (adminFirestore, excludeUid = null) => {
  try {
    const snapshot = await adminFirestore.collection('users').get();
    const tokens = [];
    snapshot.docs.forEach(doc => {
      if (doc.id === excludeUid) return;
      const data = doc.data();
      if (data.expoPushToken && data.expoPushToken.startsWith('ExponentPushToken')) {
        tokens.push(data.expoPushToken);
      }
    });
    return tokens;
  } catch {
    return [];
  }
};

const getTokensByRole = async (adminFirestore, roles = [], excludeUid = null) => {
  try {
    const tokens = [];
    for (const role of roles) {
      let query = adminFirestore.collection('users').where('role', '==', role);
      if (role === 'staff') {
        query = query.where('verificationStatus', '==', 'approved');
      }
      const snapshot = await query.get();
      snapshot.docs.forEach(doc => {
        if (doc.id === excludeUid) return;
        const data = doc.data();
        if (data.expoPushToken && data.expoPushToken.startsWith('ExponentPushToken')) {
          tokens.push(data.expoPushToken);
        }
      });
    }
    return tokens;
  } catch {
    return [];
  }
};

const getTokensByDesignation = async (adminFirestore, designation, excludeUid = null) => {
  try {
    const snapshot = await adminFirestore.collection('users')
      .where('role', '==', 'staff')
      .where('designation', '==', designation)
      .where('verificationStatus', '==', 'approved')
      .get();
    const tokens = [];
    snapshot.docs.forEach(doc => {
      if (doc.id === excludeUid) return;
      const data = doc.data();
      if (data.expoPushToken && data.expoPushToken.startsWith('ExponentPushToken')) {
        tokens.push(data.expoPushToken);
      }
    });
    return tokens;
  } catch {
    return [];
  }
};

module.exports = { sendPushNotification, getAllUserTokens, getTokensByRole, getTokensByDesignation };