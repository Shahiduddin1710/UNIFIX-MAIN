const express = require('express');
const router = express.Router();
const { verifyAdminToken } = require('../middleware/roleMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
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
} = require('../controllers/adminController');

router.post('/login', authLimiter, login);

router.get('/pending-staff', verifyAdminToken, getPendingStaff);
router.get('/all-staff', verifyAdminToken, getAllStaff);
router.get('/staff/:uid', verifyAdminToken, getStaffById);
router.post('/approve-staff', verifyAdminToken, approveStaff);
router.post('/reject-staff', verifyAdminToken, rejectStaff);
router.get('/stats', verifyAdminToken, getStats);
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

module.exports = router;