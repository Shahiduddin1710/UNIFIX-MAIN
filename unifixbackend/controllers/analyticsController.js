const admin = require('../config/firebase');
const { sendSuccess, sendError } = require('../utils/response');

const getSeconds = (ts) => {
  if (!ts) return null;
  if (typeof ts.toMillis === 'function') return ts.toMillis() / 1000;
  if (typeof ts._seconds === 'number') return ts._seconds;
  if (typeof ts.seconds === 'number') return ts.seconds;
  return null;
};

const getAnalytics = async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('complaints').get();
    const complaints = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const total = complaints.length;

    const byCategory = {};
    complaints.forEach(c => {
      const cat = c.category || 'unknown';
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    });

    const completed = complaints.filter(c => c.status === 'completed' && c.createdAt && c.completedAt);
    let avgResolutionMinutes = null;
    if (completed.length > 0) {
      const totalMs = completed.reduce((sum, c) => {
        const start = getSeconds(c.createdAt);
        const end = getSeconds(c.completedAt);
        return start && end ? sum + (end - start) * 1000 : sum;
      }, 0);
      avgResolutionMinutes = Math.round(totalMs / completed.length / 60000);
    }

    const flagged = complaints.filter(c => c.flagged);
    const escalationRate = total > 0 ? ((flagged.length / total) * 100).toFixed(1) : '0.0';

    const staffSnap = await admin.firestore()
      .collection('users')
      .where('role', '==', 'staff')
      .where('verificationStatus', '==', 'approved')
      .get();

    const staffPerformance = staffSnap.docs.map(doc => {
      const d = doc.data();
      return {
        uid: doc.id,
        fullName: d.fullName || '',
        designation: d.designation || '',
        avgRating: d.avgRating || null,
        ratingCount: d.ratingCount || 0,
        completedComplaints: complaints.filter(c => c.assignedTo === doc.id && c.status === 'completed').length,
      };
    });

    const statusBreakdown = {
      pending: complaints.filter(c => c.status === 'pending').length,
      assigned: complaints.filter(c => c.status === 'assigned').length,
      in_progress: complaints.filter(c => c.status === 'in_progress').length,
      completed: complaints.filter(c => c.status === 'completed').length,
      rejected: complaints.filter(c => c.status === 'rejected').length,
    };

    sendSuccess(res, {
      total,
      byCategory,
      avgResolutionMinutes,
      escalationRate: `${escalationRate}%`,
      escalatedCount: flagged.length,
      statusBreakdown,
      staffPerformance,
    });
  } catch (error) {
    sendError(res, error.message);
  }
};

module.exports = { getAnalytics };  