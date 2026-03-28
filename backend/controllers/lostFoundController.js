const admin = require('../config/firebase');
const { sendSuccess, sendError } = require('../utils/response');
const { sendPushNotification, getAllUserTokens } = require('../services/notificationService');

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

    const tokens = await getAllUserTokens(admin.firestore(), uid);

    await sendPushNotification(
      tokens,
      'Lost & Found',
      `${userData.fullName || 'Someone'} posted a found item: ${itemName.trim()} — Collect from ${collectLocation.trim()}`,
      { type: 'new_lost_found', itemId: docRef.id }
    );

    sendSuccess(res, { itemId: docRef.id, message: 'Item posted successfully.' });
  } catch (error) {
    sendError(res, error.message);
  }
};

const feed = async (req, res) => {
  try {
    const uid = req.user.uid;

    const snapshot = await admin.firestore()
      .collection('lostFound')
      .where('status', '==', 'available')
      .orderBy('createdAt', 'desc')
      .get();

    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      isMyPost: doc.data().postedBy === uid,
    }));

    sendSuccess(res, { items });
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

    await ref.update({
      status: 'handed_over',
      handedToName: handedToName.trim(),
      handedAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });

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

module.exports = { post, feed, handover, myPosts };