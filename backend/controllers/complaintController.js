const admin = require('../config/firebase');
const { sendSuccess, sendError } = require('../utils/response');
const { sendPushNotification, getTokensByDesignation, getTokenForUid } = require('../services/notificationService');

const CATEGORY_DESIGNATION_MAP = {
  electrical: 'Electrician',
  plumbing: 'Plumber',
  carpentry: 'Carpenter',
  cleaning: 'Cleaner',
  technician: 'Technician',
  safety: 'Safety Officer',
  washroom: 'Cleaner',
  others: null,
};

const generateTicketId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `UNF-${timestamp}-${random}`;
};

const getPhoneForUid = async (uid) => {
  try {
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    return userDoc.exists ? userDoc.data().phone || '' : '';
  } catch {
    return '';
  }
};

const getSeconds = (ts) => {
  if (!ts) return null;
  if (typeof ts.toMillis === 'function') return ts.toMillis() / 1000;
  if (typeof ts._seconds === 'number') return ts._seconds;
  if (typeof ts.seconds === 'number') return ts.seconds;
  if (typeof ts === 'number') return ts;
  return null;
};

const notifyReporter = async (reporterUid, title, body, data) => {
  const tokens = await getTokenForUid(admin.firestore(), reporterUid);
  if (tokens.length > 0) sendPushNotification(tokens, title, body, data);
};

const notifyStaffMember = async (staffUid, title, body, data) => {
  const tokens = await getTokenForUid(admin.firestore(), staffUid);
  if (tokens.length > 0) sendPushNotification(tokens, title, body, data);
};

const submit = async (req, res) => {
  try {
    const { category, subIssue, customIssue, description, building, roomDetail, photoUrl } = req.body;
    const uid = req.user.uid;

    if (!subIssue && !customIssue) return sendError(res, 'Please select or enter an issue', 400);

    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) return sendError(res, 'User not found', 404);

    const userData = userDoc.data();
    const ticketId = generateTicketId();
    let assignableTo = [];
    let requiredDesignation = null;
    let notifyGender = null;

    if (category === 'washroom') {
      const userGender = userData.gender || null;
      if (!userGender) return sendError(res, 'Your profile does not have a gender set. Please update your profile first.', 400);
      const staffSnapshot = await admin.firestore()
        .collection('users')
        .where('role', '==', 'staff')
        .where('designation', '==', 'Cleaner')
        .where('verificationStatus', '==', 'approved')
        .where('gender', '==', userGender)
        .get();
      assignableTo = staffSnapshot.docs.map(doc => doc.id);
      requiredDesignation = 'Cleaner';
      notifyGender = userGender;
    } else {
      requiredDesignation = CATEGORY_DESIGNATION_MAP[category] || null;
      if (requiredDesignation) {
        const staffSnapshot = await admin.firestore()
          .collection('users')
          .where('role', '==', 'staff')
          .where('designation', '==', requiredDesignation)
          .where('verificationStatus', '==', 'approved')
          .get();
        assignableTo = staffSnapshot.docs.map(doc => doc.id);
      }
    }

    const complaintData = {
      ticketId,
      category,
      subIssue: subIssue || null,
      customIssue: customIssue || null,
      description: description || '',
      building,
      roomDetail: roomDetail || '',
      photoUrl: photoUrl || null,
      submittedBy: uid,
      submittedByName: userData.fullName || '',
      submittedByRole: userData.role || '',
      submittedByEmail: userData.email || '',
      submittedByPhone: userData.phone || '',
      submittedByGender: userData.gender || '',
      assignableTo,
      rejectedBy: [],
      assignedTo: null,
      assignedToName: null,
      assignedToPhone: null,
      status: 'pending',
      queueStatus: 'waiting_for_staff',
      rating: null,
      ratingComment: null,
      ratedAt: null,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      completedAt: null,
    };

    const docRef = await admin.firestore().collection('complaints').add(complaintData);

    if (assignableTo.length > 0 && requiredDesignation) {
      const staffTokens = await getTokensByDesignation(admin.firestore(), requiredDesignation, uid, notifyGender);
      const issueTitle = subIssue || customIssue || 'New Issue';
      sendPushNotification(staffTokens, 'New Complaint Assigned', `${userData.fullName || 'Someone'} reported: ${issueTitle} at ${building}`, {
        type: 'new_complaint',
        complaintId: docRef.id,
        ticketId,
      });
    }

    sendSuccess(res, {
      ticketId,
      complaintId: docRef.id,
      message: 'Complaint submitted successfully',
      queueStatus: 'waiting_for_staff',
      assignableStaffCount: assignableTo.length,
    });
  } catch (error) {
    sendError(res, error.message);
  }
};

const accept = async (req, res) => {
  try {
    const { complaintId } = req.body;
    const uid = req.user.uid;
    if (!complaintId) return sendError(res, 'Complaint ID required', 400);

    const staffDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!staffDoc.exists) return sendError(res, 'Staff not found', 404);

    const complaintRef = admin.firestore().collection('complaints').doc(complaintId);
    const complaintDoc = await complaintRef.get();
    if (!complaintDoc.exists) return sendError(res, 'Complaint not found', 404);

    const complaint = complaintDoc.data();
    if (complaint.status !== 'pending') return sendError(res, 'Complaint already accepted by someone else', 400);
    if (!complaint.assignableTo.includes(uid)) return sendError(res, 'You are not authorized to accept this complaint', 403);

    const staffData = staffDoc.data();

    await complaintRef.update({
      status: 'assigned',
      queueStatus: 'assigned',
      assignedTo: uid,
      assignedToName: staffData.fullName || '',
      assignedToPhone: staffData.phone || '',
      updatedAt: admin.firestore.Timestamp.now(),
    });

    const issueTitle = complaint.subIssue || complaint.customIssue || 'Your complaint';

    await notifyReporter(complaint.submittedBy, 'Complaint Accepted', `${staffData.fullName || 'A staff member'} has accepted your complaint: ${issueTitle}`, {
      type: 'complaint_accepted',
      complaintId,
      ticketId: complaint.ticketId,
    });

    await notifyStaffMember(uid, 'Complaint Accepted', `You accepted: ${issueTitle} at ${complaint.building}`, {
      type: 'complaint_accepted',
      complaintId,
      ticketId: complaint.ticketId,
    });

    sendSuccess(res, { message: 'Complaint accepted successfully' });
  } catch (error) {
    sendError(res, error.message);
  }
};

const updateStatus = async (req, res) => {
  try {
    const { complaintId, status } = req.body;
    const uid = req.user.uid;
    if (!complaintId || !status) return sendError(res, 'Complaint ID and status required', 400);

    const validStatuses = ['in_progress', 'completed'];
    if (!validStatuses.includes(status)) return sendError(res, 'Invalid status', 400);

    const complaintRef = admin.firestore().collection('complaints').doc(complaintId);
    const complaintDoc = await complaintRef.get();
    if (!complaintDoc.exists) return sendError(res, 'Complaint not found', 404);

    const complaint = complaintDoc.data();
    if (complaint.assignedTo !== uid) return sendError(res, 'You are not assigned to this complaint', 403);

    const updateData = {
      status,
      queueStatus: status,
      updatedAt: admin.firestore.Timestamp.now(),
    };
    if (status === 'completed') updateData.completedAt = admin.firestore.Timestamp.now();

    await complaintRef.update(updateData);

    const issueTitle = complaint.subIssue || complaint.customIssue || 'Your complaint';

    if (status === 'in_progress') {
      await notifyReporter(complaint.submittedBy, 'Work In Progress', `Work has started on your complaint: ${issueTitle}`, {
        type: 'complaint_in_progress',
        complaintId,
        ticketId: complaint.ticketId,
      });
      await notifyStaffMember(uid, 'Status Updated', `You marked "${issueTitle}" as In Progress`, {
        type: 'complaint_in_progress',
        complaintId,
        ticketId: complaint.ticketId,
      });
    }

    if (status === 'completed') {
      await notifyReporter(complaint.submittedBy, 'Complaint Resolved', `Your complaint "${issueTitle}" has been resolved. Please rate the work.`, {
        type: 'complaint_completed',
        complaintId,
        ticketId: complaint.ticketId,
      });
      await notifyStaffMember(uid, 'Task Completed', `You completed: ${issueTitle}`, {
        type: 'complaint_completed',
        complaintId,
        ticketId: complaint.ticketId,
      });
    }

    sendSuccess(res, { message: `Status updated to ${status}` });
  } catch (error) {
    sendError(res, error.message);
  }
};

const reject = async (req, res) => {
  try {
    const { complaintId, reason } = req.body;
    if (!complaintId || !reason) return sendError(res, 'complaintId and reason are required.', 400);

    const uid = req.user.uid;
    const ref = admin.firestore().collection('complaints').doc(complaintId);
    const snap = await ref.get();
    if (!snap.exists) return sendError(res, 'Complaint not found.', 404);

    const complaint = snap.data();
    if (!complaint.assignableTo?.includes(uid)) return sendError(res, 'You are not authorized to reject this complaint.', 403);
    if (complaint.status !== 'pending') return sendError(res, 'Only pending complaints can be rejected.', 400);

    const staffSnap = await admin.firestore().collection('users').doc(uid).get();
    const staffName = staffSnap.exists ? staffSnap.data().fullName : 'Staff';

    const newAssignableTo = complaint.assignableTo.filter(id => id !== uid);
    const rejectedBy = complaint.rejectedBy || [];
    rejectedBy.push({ uid, name: staffName, reason, rejectedAt: new Date().toISOString() });

    const updateData = {
      assignableTo: newAssignableTo,
      rejectedBy,
      updatedAt: admin.firestore.Timestamp.now(),
    };

    if (newAssignableTo.length === 0) {
      updateData.status = 'rejected';
      updateData.queueStatus = 'rejected';
      updateData.rejectionReason = reason;

      const issueTitle = complaint.subIssue || complaint.customIssue || 'Your complaint';
      await notifyReporter(complaint.submittedBy, 'Complaint Rejected', `Unfortunately your complaint "${issueTitle}" could not be assigned to any staff.`, {
        type: 'complaint_rejected',
        complaintId,
        ticketId: complaint.ticketId,
      });
    }

    await ref.update(updateData);

    sendSuccess(res, {
      message: newAssignableTo.length > 0
        ? 'You rejected this complaint. Other staff can still accept it.'
        : 'Complaint rejected by all staff.',
    });
  } catch (error) {
    sendError(res, error.message);
  }
};

const rate = async (req, res) => {
  try {
    const { complaintId, rating, comment } = req.body;
    const uid = req.user.uid;

    const ref = admin.firestore().collection('complaints').doc(complaintId);
    const snap = await ref.get();
    if (!snap.exists) return sendError(res, 'Complaint not found.', 404);

    const complaint = snap.data();
    if (complaint.submittedBy !== uid) return sendError(res, 'You can only rate your own complaints.', 403);
    if (complaint.status !== 'completed') return sendError(res, 'You can only rate completed complaints.', 400);
    if (complaint.rating !== null && complaint.rating !== undefined) return sendError(res, 'You have already rated this complaint.', 400);
    if (!complaint.assignedTo) return sendError(res, 'No staff assigned to rate.', 400);

    await ref.update({
      rating,
      ratingComment: comment || null,
      ratedAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });

    const staffRef = admin.firestore().collection('users').doc(complaint.assignedTo);
    const staffSnap = await staffRef.get();
    if (staffSnap.exists) {
      const staffData = staffSnap.data();
      const newCount = (staffData.ratingCount || 0) + 1;
      const newTotal = (staffData.ratingTotal || 0) + rating;
      await staffRef.update({
        ratingTotal: newTotal,
        ratingCount: newCount,
        avgRating: Math.round((newTotal / newCount) * 10) / 10,
      });

      const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      await notifyStaffMember(complaint.assignedTo, 'New Rating Received', `You received ${rating}/5 ${stars} for: ${complaint.subIssue || complaint.customIssue || 'a complaint'}`, {
        type: 'new_rating',
        complaintId,
      });
    }

    sendSuccess(res, { message: 'Rating submitted successfully.' });
  } catch (error) {
    sendError(res, error.message);
  }
};

const myComplaints = async (req, res) => {
  try {
    const uid = req.user.uid;
    const snapshot = await admin.firestore()
      .collection('complaints')
      .where('submittedBy', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();

    const complaints = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        let assignedToPhone = data.assignedToPhone || '';
        if (data.assignedTo && !assignedToPhone) assignedToPhone = await getPhoneForUid(data.assignedTo);
        return { id: doc.id, ...data, assignedToPhone };
      })
    );

    sendSuccess(res, { complaints });
  } catch (error) {
    sendError(res, error.message);
  }
};

const staffComplaints = async (req, res) => {
  try {
    const uid = req.user.uid;

    const [pendingSnapshot, assignedSnapshot] = await Promise.all([
      admin.firestore().collection('complaints')
        .where('assignableTo', 'array-contains', uid)
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .get(),
      admin.firestore().collection('complaints')
        .where('assignedTo', '==', uid)
        .orderBy('createdAt', 'desc')
        .get(),
    ]);

    const rejectedSnapshot = await admin.firestore()
      .collection('complaints')
      .where('status', '==', 'rejected')
      .orderBy('createdAt', 'desc')
      .get();

    const seenIds = new Set();
    const allDocs = [...pendingSnapshot.docs, ...assignedSnapshot.docs, ...rejectedSnapshot.docs];
    const uniqueDocs = allDocs.filter(doc => {
      if (seenIds.has(doc.id)) return false;
      seenIds.add(doc.id);
      return true;
    });

    const uniqueUids = [...new Set(uniqueDocs.map(doc => doc.data().submittedBy).filter(Boolean))];
    const phoneMap = {};
    await Promise.all(uniqueUids.map(async reporterUid => {
      phoneMap[reporterUid] = await getPhoneForUid(reporterUid);
    }));

    const attachPhone = doc => {
      const data = doc.data();
      const livePhone = phoneMap[data.submittedBy] || '';
      return { id: doc.id, ...data, submittedByPhone: livePhone || data.submittedByPhone || '' };
    };

    const pending = pendingSnapshot.docs.map(attachPhone);
    const assigned = assignedSnapshot.docs.map(attachPhone);
    const active = assigned.filter(c => c.status === 'assigned' || c.status === 'in_progress');
    const completed = assigned.filter(c => c.status === 'completed');

    const completedWithTimes = completed.filter(c => c.createdAt && c.completedAt);
    let avgTimeMinutes = null;
    if (completedWithTimes.length > 0) {
      const totalMs = completedWithTimes.reduce((sum, c) => {
        const start = getSeconds(c.createdAt);
        const end = getSeconds(c.completedAt);
        return start !== null && end !== null ? sum + Math.max(0, (end - start) * 1000) : sum;
      }, 0);
      const validCount = completedWithTimes.filter(c => getSeconds(c.createdAt) && getSeconds(c.completedAt)).length;
      avgTimeMinutes = validCount > 0 ? Math.round(totalMs / validCount / 60000) : null;
    }

    const staffSnap = await admin.firestore().collection('users').doc(uid).get();
    const staffData = staffSnap.exists ? staffSnap.data() : {};

    const rejected = uniqueDocs
      .map(attachPhone)
      .filter(c => Array.isArray(c.rejectedBy) && c.rejectedBy.some(r => r.uid === uid));

    sendSuccess(res, {
      pending,
      active,
      completed,
      rejected,
      avgTimeMinutes,
      avgRating: staffData.avgRating || null,
      ratingCount: staffData.ratingCount || 0,
    });
  } catch (error) {
    sendError(res, error.message);
  }
};

const allComplaints = async (req, res) => {
  try {
    const snapshot = await admin.firestore()
      .collection('complaints')
      .orderBy('createdAt', 'desc')
      .get();
    const complaints = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    sendSuccess(res, { complaints });
  } catch (error) {
    sendError(res, error.message);
  }
};

module.exports = { submit, accept, updateStatus, reject, rate, myComplaints, staffComplaints, allComplaints };