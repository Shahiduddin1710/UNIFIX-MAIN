const express = require('express');
const router = express.Router();
const { verifyAdminToken } = require('../middleware/roleMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { submitComplaintSchema, acceptComplaintSchema, updateStatusSchema, rejectComplaintSchema, rateComplaintSchema } = require('../schemas/complaintSchema');
const {
  login,
  getPendingStaff,
  getAllStaff,
  getStaffById,
  approveStaff,
  rejectStaff,
  getStats,
  getAllComplaints,
  getAllUsers,
  getUserIdCard,
  getIdCardRequests,
  approveIdCard,
  rejectIdCard,
  getDeletionRequests,
  approveDeletion,
  rejectDeletion,
  getSecurityIssues,
  resolveSecurityIssue,
  getAllLostFound,
  iwillhandle,
  markFlagResolved,
} = require('../controllers/adminController');
const { checkEscalations } = require('../controllers/escalationController');

router.post('/login', authLimiter, login);

router.post('/check-escalations', (req, res, next) => {
  if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
}, checkEscalations);

router.get('/pending-staff', verifyAdminToken, getPendingStaff);
router.get('/all-staff', verifyAdminToken, getAllStaff);
router.get('/staff/:uid', verifyAdminToken, getStaffById);
router.post('/approve-staff', verifyAdminToken, approveStaff);
router.post('/reject-staff', verifyAdminToken, rejectStaff);
router.get('/stats', verifyAdminToken, getStats);
router.get('/all-complaints/hash', verifyAdminToken, async (req, res) => {
  try {
    const admin = require('../config/firebase');
    const snapshot = await admin.firestore()
      .collection('complaints')
      .orderBy('updatedAt', 'desc')
      .limit(1)
      .get();
    const count = (await admin.firestore()
      .collection('complaints')
      .count()
      .get()).data().count;
    const latest = snapshot.empty ? 0 : (snapshot.docs[0].data().updatedAt?._seconds || 0);
    res.json({ hash: `${count}_${latest}`, serverTime: Date.now() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router.get('/all-complaints/hash', verifyAdminToken, async (req, res) => {
  try {
    const admin = require('../config/firebase');
    const snapshot = await admin.firestore()
      .collection('complaints')
      .orderBy('updatedAt', 'desc')
      .limit(1)
      .get();

    const count = (await admin.firestore()
      .collection('complaints')
      .count()
      .get()).data().count;

    const latest = snapshot.empty ? 0 : (snapshot.docs[0].data().updatedAt?._seconds || 0);

    res.json({ hash: `${count}_${latest}`, serverTime: Date.now() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/all-complaints', verifyAdminToken, getAllComplaints);
router.get('/all-users', verifyAdminToken, getAllUsers);
router.get('/user/:uid/idcard', verifyAdminToken, getUserIdCard);
router.get('/idcard-requests', verifyAdminToken, getIdCardRequests);
router.post('/approve-idcard', verifyAdminToken, approveIdCard);
router.post('/reject-idcard', verifyAdminToken, rejectIdCard);
router.get('/deletion-requests', verifyAdminToken, getDeletionRequests);
router.post('/approve-deletion', verifyAdminToken, approveDeletion);
router.post('/reject-deletion', verifyAdminToken, rejectDeletion);
router.get('/security-issues', verifyAdminToken, getSecurityIssues);
router.post('/resolve-security-issue', verifyAdminToken, resolveSecurityIssue);
router.get('/all-lost-found', verifyAdminToken, getAllLostFound);
router.post('/iwillhandle', verifyAdminToken, iwillhandle);
router.post('/mark-flag-resolved', verifyAdminToken, markFlagResolved);
router.get('/all-lost-reports', verifyAdminToken, async (req, res) => {
  try {
    const admin = require('../config/firebase');
    const snap = await admin.firestore()
      .collection('lost_reports')
      .orderBy('postedAt', 'desc')
      .get();
    const reports = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json({ success: true, reports });
  } catch (e) {
    return res.json({ success: false, message: e.message });
  }
});

router.get('/user/:uid', verifyAdminToken, async (req, res) => {
  try {
    const admin = require('../config/firebase');
    const snap = await admin.firestore().collection('users').doc(req.params.uid).get();
    if (!snap.exists) return res.json({ success: false, message: 'User not found' });
    const data = snap.data();
    return res.json({
      success: true,
      user: {
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        designation: data.designation || '',
        employeeId: data.employeeId || '',
      }
    });
  } catch (e) {
    return res.json({ success: false, message: e.message });
  }
});
module.exports = router;