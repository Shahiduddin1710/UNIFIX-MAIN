const admin = require('../config/firebase');
const { sendSuccess, sendError } = require('../utils/response');
const { sendPushNotification, getAllUserTokens, getTokenForUid } = require('../services/notificationService');

const post = async (req, res) => {
  try {
    const { itemName, category, description, locationLost, dateLost, howToReach, images } = req.body;
    const uid = req.user.uid;

    if (!itemName || !category || !description || !locationLost || !dateLost || !howToReach) {
      return sendError(res, 'All required fields must be filled.', 400);
    }

    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) return sendError(res, 'User not found', 404);

    const userData = userDoc.data();

    if (userData.role === 'staff') {
      return sendError(res, 'Staff cannot post lost reports.', 403);
    }

    const docRef = await admin.firestore().collection('lost_reports').add({
      itemName: itemName.trim(),
      category,
      description: description.trim(),
      locationLost,
      dateLost,
      howToReach: howToReach.trim(),
      images: images || [],
      postedBy: {
        uid,
        name: userData.fullName || '',
        role: userData.role || '',
        department: userData.department || '',
      },
      postedAt: admin.firestore.Timestamp.now(),
      status: 'active',
    });

    const tokens = await getAllUserTokens(admin.firestore(), uid);

    await sendPushNotification(
      tokens,
      'Lost Item Report',
      `${userData.fullName || 'Someone'} lost a ${itemName.trim()} — can you help?`,
      { type: 'new_lost_report', itemId: docRef.id }
    );

    sendSuccess(res, { reportId: docRef.id, message: 'Lost report posted successfully.' });
  } catch (error) {
    sendError(res, error.message);
  }
};

const feed = async (req, res) => {
  try {
   const snapshot = await admin.firestore()
  .collection('lost_reports')
  .whereIn('status', ['active', 'found'])
  .orderBy('postedAt', 'desc')
  .get();

    const uid = req.user.uid;

    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      isMyPost: doc.data().postedBy?.uid === uid,
    }));

    sendSuccess(res, { items });
  } catch (error) {
    sendError(res, error.message);
  }
};

const markFound = async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;

    const ref = admin.firestore().collection('lost_reports').doc(id);
    const snap = await ref.get();

    if (!snap.exists) return sendError(res, 'Report not found.', 404);

    const data = snap.data();

    if (data.postedBy?.uid !== uid) {
      return sendError(res, 'Only the owner can mark this as found.', 403);
    }

    if (data.status !== 'active') {
      return sendError(res, 'This report is no longer active.', 400);
    }

    await ref.update({ status: 'found', updatedAt: admin.firestore.Timestamp.now() });

    const ownerTokens = await getTokenForUid(admin.firestore(), uid);

    await sendPushNotification(
      ownerTokens,
      'Item Found!',
      `Great news! Your lost item "${data.itemName}" has been marked as found.`,
      { type: 'lost_report_found', itemId: id }
    );

    sendSuccess(res, { message: 'Marked as found.' });
  } catch (error) {
    sendError(res, error.message);
  }
};

const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;

    const ref = admin.firestore().collection('lost_reports').doc(id);
    const snap = await ref.get();

    if (!snap.exists) return sendError(res, 'Report not found.', 404);

    if (snap.data().postedBy?.uid !== uid) {
      return sendError(res, 'Only the owner can delete this report.', 403);
    }

    await ref.delete();

    sendSuccess(res, { message: 'Report deleted.' });
  } catch (error) {
    sendError(res, error.message);
  }
};

module.exports = { post, feed, markFound, deleteReport };