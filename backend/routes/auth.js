const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const {
  signup,
  verifyOtp,
  resendOtp,
  forgotPassword,
  verifyResetOtp,
  validateResetOtp,
  login,
  changePassword,
  updateProfile,
  logoutAllDevices,
  deleteAccount,
  reportSecurityIssue,
  requestIdCardUpdate,
  myProfile,
  savePushToken,
} = require('../controllers/authController');

router.post('/signup', signup);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/validate-reset-otp', validateResetOtp);
router.post('/login', login);
router.post('/change-password', verifyToken, changePassword);
router.post('/update-profile', verifyToken, updateProfile);
router.post('/logout-all-devices', verifyToken, logoutAllDevices);
router.post('/delete-account', verifyToken, deleteAccount);
router.post('/report-security-issue', verifyToken, reportSecurityIssue);
router.post('/request-idcard-update', verifyToken, requestIdCardUpdate);
router.get('/my-profile', verifyToken, myProfile);
router.post('/save-push-token', verifyToken, savePushToken);

module.exports = router;