const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const validate = require('../middleware/validate');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const {
  signupSchema, loginSchema, verifyOtpSchema,
  forgotPasswordSchema, verifyResetOtpSchema,
  changePasswordSchema, savePushTokenSchema,
} = require('../schemas/authSchema');
const { raggingSchema } = require('../schemas/raggingSchema');
const {
  signup, verifyOtp, resendOtp, forgotPassword, verifyResetOtp,
  validateResetOtp, login, changePassword, updateProfile,
  logoutAllDevices, deleteAccount, reportSecurityIssue,
  requestIdCardUpdate, myProfile, savePushToken, reportRagging,
} = require('../controllers/authController');

router.post('/signup', authLimiter, validate(signupSchema), signup);
router.post('/verify-otp', otpLimiter, validate(verifyOtpSchema), verifyOtp);
router.post('/resend-otp', otpLimiter, resendOtp);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/verify-reset-otp', otpLimiter, validate(verifyResetOtpSchema), verifyResetOtp);
router.post('/validate-reset-otp', validateResetOtp);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/change-password', verifyToken, validate(changePasswordSchema), changePassword);
router.post('/update-profile', verifyToken, updateProfile);
router.post('/logout-all-devices', verifyToken, logoutAllDevices);
router.post('/delete-account', verifyToken, deleteAccount);
router.post('/report-security-issue', verifyToken, reportSecurityIssue);
router.post('/request-idcard-update', verifyToken, requestIdCardUpdate);
router.get('/my-profile', verifyToken, myProfile);
router.post('/save-push-token', verifyToken, validate(savePushTokenSchema), savePushToken);
router.post('/report-ragging', verifyToken, validate(raggingSchema), reportRagging);

module.exports = router;