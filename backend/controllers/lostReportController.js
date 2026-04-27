const admin = require('../config/firebase');
const { sendSuccess, sendError } = require('../utils/response');
const { sendPushNotification, getAllUserTokens, getTokenForUid } = require('../services/notificationService');

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

    const ownerTokens = await getTokenForUid(admin.firestore(), uid);
    const otherStudentTeacherTokens = await getStudentTeacherTokensExcept(admin.firestore(), uid);

    if (ownerTokens.length > 0) {
      await sendPushNotification(
        ownerTokens,
        'Lost Item Report',
        `You posted a lost item report: ${itemName.trim()}`,
        { type: 'new_lost_report', reportId: docRef.id }
      );
    }

    if (otherStudentTeacherTokens.length > 0) {
      await sendPushNotification(
        otherStudentTeacherTokens,
        'Lost Item Report',
        `${userData.fullName || 'Someone'} lost a ${itemName.trim()} — can you help?`,
        { type: 'new_lost_report', reportId: docRef.id }
      );
    }

    sendSuccess(res, { reportId: docRef.id, message: 'Lost report posted successfully.' });
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
      .collection('lost_reports')
      .where('status', 'in', ['active', 'found'])
      .orderBy('postedAt', 'desc')
      .limit(limit);

    if (after) {
      const cursorDoc = await admin.firestore().collection('lost_reports').doc(after).get();
      if (cursorDoc.exists) q = q.startAfter(cursorDoc);
    }

    const snapshot = await q.get();

    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      postedAt: doc.data().postedAt?.toMillis?.() ?? doc.data().postedAt ?? null,
      isMyPost: doc.data().postedBy?.uid === uid,
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
    const otherStudentTeacherTokens = await getStudentTeacherTokensExcept(admin.firestore(), uid);

    if (ownerTokens.length > 0) {
      await sendPushNotification(
        ownerTokens,
        'Item Found!',
        `You marked your "${data.itemName}" as found.`,
        { type: 'lost_report_found', reportId: id }
      );
    }

    if (otherStudentTeacherTokens.length > 0) {
      await sendPushNotification(
        otherStudentTeacherTokens,
        'Item Found!',
        `${data.postedBy?.name || 'Someone'}'s lost "${data.itemName}" has been found!`,
        { type: 'lost_report_found', reportId: id }
      );
    }

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