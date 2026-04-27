const admin = require('../config/firebase');
const { sendSuccess, sendError } = require('../utils/response');
const { sendPushNotification, getAllUserTokens, getTokenForUid } = require('../services/notificationService');

const getAllTokensExcept = async (firestore, excludeUid = null) => {
  const snapshot = await firestore.collection('users').get();
  const tokens = [];
  snapshot.forEach(doc => {
    if (excludeUid && doc.id === excludeUid) return;
    const data = doc.data();
    if (data.role === 'staff' && data.verificationStatus !== 'approved') return;
    const token = data.expoPushToken || data.pushToken;
    if (token) tokens.push(token);
  });
  return tokens;
};

const getStaffTokensExcept = async (firestore, excludeUid = null) => {
  const snapshot = await firestore.collection('users')
    .where('role', '==', 'staff')
    .where('verificationStatus', '==', 'approved')
    .get();
  const tokens = [];
  snapshot.forEach(doc => {
    if (excludeUid && doc.id === excludeUid) return;
    const token = doc.data().expoPushToken || doc.data().pushToken;
    if (token) tokens.push(token);
  });
  return tokens;
};

const getStudentTeacherTokensExcept = async (firestore, excludeUid = null) => {
  const snapshot = await firestore.collection('users')
    .where('role', 'in', ['student', 'teacher'])
    .get();
  const tokens = [];
  snapshot.forEach(doc => {
    if (excludeUid && doc.id === excludeUid) return;
    const token = doc.data().expoPushToken || doc.data().pushToken;
    if (token) tokens.push(token);
  });
  return tokens;
};

const post = async (req, res) => {
  try {
    const { itemName, category, description, roomNumber, roomLabel, collectLocation, photoUrl } = req.body;
    const uid = req.user.uid;

    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) return sendError(res, 'User not found', 404);

    const userData = userDoc.data();

    const docRef = await admin.firestore().collection('lostFound').add({
      itemName: itemName.trim(),
      category: category || 'Others',
      description: description || '',
      roomNumber: roomNumber.trim(),
      roomLabel: roomLabel || '',
      collectLocation: collectLocation.trim(),
      photoUrl: photoUrl || null,
      postedBy: uid,
      postedByName: userData.fullName || '',
      postedByRole: userData.role || '',
      postedByEmail: userData.email || '',
      status: 'available',
      handedToName: null,
      handedAt: null,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });

   const ownerTokens = await getTokenForUid(admin.firestore(), uid);
    const othersTokens = await getAllTokensExcept(admin.firestore(), uid);

    if (ownerTokens.length > 0) {
      await sendPushNotification(
        ownerTokens,
        'Lost & Found',
        `You posted a found item: ${itemName.trim()} — Collect from ${collectLocation.trim()}`,
        { type: 'new_lost_found', itemId: docRef.id, postedByRole: userData.role || '' }
      );
    }

    if (othersTokens.length > 0) {
      await sendPushNotification(
        othersTokens,
        'Lost & Found',
        `${userData.fullName || 'Someone'} found: ${itemName.trim()} — Collect from ${collectLocation.trim()}`,
        { type: 'new_lost_found', itemId: docRef.id, postedByRole: userData.role || '' }
      );
    }

    sendSuccess(res, { itemId: docRef.id, message: 'Item posted successfully.' });

    sendSuccess(res, { itemId: docRef.id, message: 'Item posted successfully.' });
  } catch (error) {
    sendError(res, error.message);
  }
};
const feed = async (req, res) => {
  try {
    const uid = req.user.uid;
    const limit = parseInt(req.query.limit) || 10;
    const after = req.query.after || null;

    let q = admin.firestore()
      .collection('lostFound')
      .where('status', '==', 'available')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (after) {
      const cursorDoc = await admin.firestore().collection('lostFound').doc(after).get();
      if (cursorDoc.exists) q = q.startAfter(cursorDoc);
    }

    const snapshot = await q.get();

    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toMillis?.() ?? doc.data().createdAt ?? null,
      isMyPost: doc.data().postedBy === uid,
    }));

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];

    sendSuccess(res, {
      items,
      nextCursor: snapshot.docs.length === limit ? lastDoc.id : null,
      hasMore: snapshot.docs.length === limit,
    });
  } catch (error) {
    sendError(res, error.message);
  }
};

const handover = async (req, res) => {
  try {
    const { itemId, handedToName } = req.body;
    const uid = req.user.uid;

    if (!itemId || !handedToName) return sendError(res, 'Item ID and recipient name are required.', 400);

    const ref = admin.firestore().collection('lostFound').doc(itemId);
    const snap = await ref.get();

    if (!snap.exists) return sendError(res, 'Item not found.', 404);

    const item = snap.data();

    if (item.postedBy !== uid) return sendError(res, 'Only the person who posted this item can mark it as handed over.', 403);
    if (item.status !== 'available') return sendError(res, 'Item already handed over.', 400);

    const handedAt = admin.firestore.Timestamp.now();

    await ref.update({
      status: 'handed_over',
      handedToName: handedToName.trim(),
      handedAt,
      updatedAt: handedAt,
    });

    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    await admin.firestore().collection('claims').add({
      itemId,
      itemName: item.itemName,
      photoUrl: item.photoUrl || null,
      handedByUid: uid,
      handedByName: userData.fullName || '',
      handedByRole: userData.role || '',
      handedToName: handedToName.trim(),
      roomNumber: item.roomNumber || '',
      roomLabel: item.roomLabel || '',
      collectLocation: item.collectLocation || '',
      handedAt,
      createdAt: handedAt,
    });

const ownerTokens = await getTokenForUid(admin.firestore(), uid);
    const othersTokens = await getAllTokensExcept(admin.firestore(), uid);

    if (ownerTokens.length > 0) {
      await sendPushNotification(
        ownerTokens,
        'Lost & Found — Item Collected',
        `You handed "${item.itemName}" over to ${handedToName.trim()}.`,
        { type: 'item_handed_over', itemId }
      );
    }

    if (othersTokens.length > 0) {
      await sendPushNotification(
        othersTokens,
        'Lost & Found — Item Collected',
        `"${item.itemName}" has been handed over to ${handedToName.trim()}.`,
        { type: 'item_handed_over', itemId }
      );
    }

    sendSuccess(res, { message: 'Item marked as handed over successfully.' });
  } catch (error) {
    sendError(res, error.message);
  }
};

const myPosts = async (req, res) => {
  try {
    const uid = req.user.uid;

    const snapshot = await admin.firestore()
      .collection('lostFound')
      .where('postedBy', '==', uid)
      .get();

    const items = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data(), isMyPost: true }))
      .sort((a, b) => {
        const aTime = a.createdAt?._seconds ?? a.createdAt?.seconds ?? 0;
        const bTime = b.createdAt?._seconds ?? b.createdAt?.seconds ?? 0;
        return bTime - aTime;
      });

    sendSuccess(res, { items });
  } catch (error) {
    sendError(res, error.message);
  }
};

const claims = async (req, res) => {
  try {
    const snapshot = await admin.firestore()
      .collection('claims')
      .orderBy('createdAt', 'desc')
      .get();

    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    sendSuccess(res, { items });
  } catch (error) {
    sendError(res, error.message);
  }
};

module.exports = { post, feed, handover, myPosts, claims };