const admin = require('../config/firebase');
const axios = require('axios');
const { generateOTP, storeOTPInFirestore, verifyOTPFromFirestore, deleteOTPFromFirestore } = require('../utils/otpUtils');
const { sendOTPEmail } = require('../services/emailService');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../services/logger');

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

const signup = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    const validRoles = ['student', 'teacher', 'staff'];
    if (!validRoles.includes(role)) return sendError(res, 'Invalid role', 400);

    const emailDomain = email.split('@')[1];
    if (role !== 'staff' && emailDomain !== 'vcet.edu.in') {
      return sendError(res, 'Invalid college email', 400);
    }

    try {
      await admin.auth().getUserByEmail(email);
      return sendError(res, 'Email already exists', 400);
    } catch (authError) {
      if (authError.code !== 'auth/user-not-found') throw authError;
    }

    const userSnapshot = await admin.firestore().collection('users').where('email', '==', email).get();
    if (!userSnapshot.empty) return sendError(res, 'Email already exists', 400);

    const otp = generateOTP();
    await storeOTPInFirestore(email, otp, 'email-verification');

    try {
      await sendOTPEmail(email, otp, fullName, 'email-verification');
    } catch {
      return sendError(res, 'Failed to send OTP email. Please try again.', 500);
    }

logger.info('[Auth] OTP sent for signup', { email });
    sendSuccess(res, { message: 'OTP sent to your email', email });
  } catch (error) {
    logger.error('[Auth] signup failed', { error: error.message });
    sendError(res, error.message);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp, fullName, password, role } = req.body;
    const isValid = await verifyOTPFromFirestore(email, otp, 'email-verification');
    if (!isValid) return sendError(res, 'Invalid or expired OTP', 400);

    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (authError) {
      if (authError.code === 'auth/user-not-found') {
        userRecord = await admin.auth().createUser({ email, password, displayName: fullName });
      } else {
        throw authError;
      }
    }

    const userDocRef = admin.firestore().collection('users').doc(userRecord.uid);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      await userDocRef.set({
        uid: userRecord.uid,
        email,
        fullName,
        role,
        emailVerified: true,
        profileCompleted: false,
        createdAt: admin.firestore.Timestamp.now(),
        lastLogin: admin.firestore.Timestamp.now(),
      });
    }

    await deleteOTPFromFirestore(email);
    const token = await admin.auth().createCustomToken(userRecord.uid);
    sendSuccess(res, { message: 'Email verified successfully', uid: userRecord.uid, token });
  } catch (error) {
    sendError(res, error.message);
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email, fullName, type } = req.body;
    const otpType = type || 'email-verification';
    if (!email || !fullName) return sendError(res, 'Email and fullName required', 400);

    const otp = generateOTP();
    await storeOTPInFirestore(email, otp, otpType);

    try {
      await sendOTPEmail(email, otp, fullName, otpType);
    } catch {
      return sendError(res, 'Failed to send OTP email. Please try again.', 500);
    }

    sendSuccess(res, { message: 'OTP resent to your email' });
  } catch (error) {
    sendError(res, error.message);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 'Email required', 400);

    const userSnapshot = await admin.firestore().collection('users').where('email', '==', email).get();
    if (userSnapshot.empty) return sendError(res, 'No account found with this email', 400);

    const userData = userSnapshot.docs[0].data();
    const otp = generateOTP();
    await storeOTPInFirestore(email, otp, 'password-reset');

    try {
      await sendOTPEmail(email, otp, userData.fullName || 'User', 'password-reset');
    } catch {
      return sendError(res, 'Failed to send OTP email. Please try again.', 500);
    }

    sendSuccess(res, { message: 'OTP sent to your email for password reset' });
  } catch (error) {
    sendError(res, error.message);
  }
};

const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return sendError(res, 'Missing required fields', 400);
    if (newPassword.length < 6) return sendError(res, 'Password must be at least 6 characters', 400);

    const isValid = await verifyOTPFromFirestore(email, otp, 'password-reset');
    if (!isValid) return sendError(res, 'Invalid or expired OTP', 400);

    const userSnapshot = await admin.firestore().collection('users').where('email', '==', email).get();
    if (userSnapshot.empty) return sendError(res, 'User not found', 400);

    const uid = userSnapshot.docs[0].data().uid;
    await admin.auth().updateUser(uid, { password: newPassword });
    await deleteOTPFromFirestore(email);

    sendSuccess(res, { message: 'Password reset successfully' });
  } catch (error) {
    sendError(res, error.message);
  }
};

const validateResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return sendError(res, 'Missing required fields', 400);

    const isValid = await verifyOTPFromFirestore(email, otp, 'password-reset');
    if (!isValid) return sendError(res, 'Invalid or expired OTP', 400);

    sendSuccess(res, { message: 'OTP is valid' });
  } catch (error) {
    sendError(res, error.message);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    try {
      await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
        { email, password, returnSecureToken: true }
      );
    } catch (firebaseError) {
      const code = firebaseError.response?.data?.error?.message || '';
      if (code.includes('TOO_MANY_ATTEMPTS')) {
        return sendError(res, 'Too many attempts. Please try again later.', 400);
      }
      return sendError(res, 'Invalid email or password', 400);
    }

    const userSnapshot = await admin.firestore().collection('users').where('email', '==', email).get();
    if (userSnapshot.empty) return sendError(res, 'User not found', 400);

    const user = userSnapshot.docs[0].data();
    if (!user.emailVerified) return sendError(res, 'Email not verified', 400);

    const token = await admin.auth().createCustomToken(user.uid);
    await admin.firestore().collection('users').doc(user.uid).update({
      lastLogin: admin.firestore.Timestamp.now(),
    });

logger.info('[Auth] Login successful', { uid: user.uid, role: user.role });
    sendSuccess(res, {
      message: 'Login successful',
      uid: user.uid,
      token,
      user: {
        uid: user.uid,
        fullName: user.fullName || '',
        email: user.email,
        role: user.role,
        profileCompleted: user.profileCompleted || false,
        verificationStatus: user.verificationStatus || null,
      },
    });
  } catch (error) {
    logger.error('[Auth] login failed', { error: error.message });
    sendError(res, error.message);
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const uid = req.user?.uid || req.uid;

    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) return sendError(res, 'User not found', 404);

    const userEmail = userDoc.data().email;

    try {
      await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
        { email: userEmail, password: currentPassword, returnSecureToken: true }
      );
    } catch {
      return sendError(res, 'Current password is incorrect', 400);
    }

    await admin.auth().updateUser(uid, { password: newPassword });
    sendSuccess(res, { message: 'Password changed successfully' });
  } catch (error) {
    sendError(res, error.message);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    const uid = req.user?.uid || req.uid;
    const updateData = {
      fullName: fullName.trim(),
      updatedAt: admin.firestore.Timestamp.now(),
    };
    if (phone !== undefined) updateData.phone = phone.trim();
    await admin.firestore().collection('users').doc(uid).update(updateData);
    sendSuccess(res, { message: 'Profile updated successfully' });
  } catch (error) {
    sendError(res, error.message);
  }
};

const logoutAllDevices = async (req, res) => {
  try {
    const uid = req.user?.uid || req.uid;
    await admin.auth().revokeRefreshTokens(uid);
    await admin.firestore().collection('users').doc(uid).update({
      tokensRevokedAt: admin.firestore.Timestamp.now(),
    });
    sendSuccess(res, { message: 'Logged out from all devices successfully' });
  } catch (error) {
    sendError(res, error.message);
  }
};

const deleteAccount = async (req, res) => {
  try {
    const uid = req.user?.uid || req.uid;
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) return sendError(res, 'User not found', 404);

    const userData = userDoc.data();

    if (userData.role === 'staff') {
      const existing = await admin.firestore()
        .collection('deletionRequests')
        .where('uid', '==', uid)
        .where('status', '==', 'pending')
        .get();

      if (!existing.empty) {
        return sendError(res, 'Deletion request already submitted and pending review', 400);
      }

      await admin.firestore().collection('deletionRequests').add({
        uid,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        designation: userData.designation || null,
        status: 'pending',
        requestedAt: admin.firestore.Timestamp.now(),
      });

      return sendSuccess(res, {
        requiresApproval: true,
        message: 'Your account deletion request has been submitted and is currently under review.',
      });
    }

    await admin.firestore().collection('deletionLogs').add({
      uid,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
      deletedAt: admin.firestore.Timestamp.now(),
    });

    await admin.firestore().collection('users').doc(uid).delete();
    await admin.auth().deleteUser(uid);

    sendSuccess(res, { message: 'Account deleted successfully' });
  } catch (error) {
    sendError(res, error.message);
  }
};

const reportSecurityIssue = async (req, res) => {
  try {
    const { issueType, description } = req.body;
    const uid = req.user?.uid || req.uid;

    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) return sendError(res, 'User not found', 404);

    const userData = userDoc.data();
    await admin.firestore().collection('securityIssues').add({
      uid,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
      issueType,
      description: description.trim(),
      status: 'open',
      reportedAt: admin.firestore.Timestamp.now(),
    });

    sendSuccess(res, { message: 'Security issue reported successfully. Our team will review it shortly.' });
  } catch (error) {
    sendError(res, error.message);
  }
};

const requestIdCardUpdate = async (req, res) => {
  try {
    const { newIdCardUrl, newIdCardName } = req.body;
    const uid = req.user?.uid || req.uid;

    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) return sendError(res, 'User not found', 404);

    const userData = userDoc.data();
    if (userData.role !== 'student' && userData.role !== 'teacher') {
      return sendError(res, 'Only students and teachers can request ID card updates', 403);
    }

    const existing = await admin.firestore()
      .collection('idCardRequests')
      .where('uid', '==', uid)
      .where('status', '==', 'pending')
      .get();

    if (!existing.empty) {
      return sendError(res, 'You already have a pending ID card update request', 400);
    }

    await admin.firestore().collection('idCardRequests').add({
      uid,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
      newIdCardUrl,
      newIdCardName: newIdCardName || null,
      currentIdCardUrl: userData.studentIdCardUrl || userData.teacherIdCardUrl || null,
      status: 'pending',
      requestedAt: admin.firestore.Timestamp.now(),
    });

    sendSuccess(res, { message: 'ID card update request submitted. Admin will review it shortly.' });
  } catch (error) {
    sendError(res, error.message);
  }
};

const myProfile = async (req, res) => {
  try {
    const uid = req.user?.uid || req.uid;
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) return sendError(res, 'User not found', 404);

    const { idCardBase64, certificateBase64, ...safeData } = userDoc.data();

    const pendingIdCard = await admin.firestore()
      .collection('idCardRequests')
      .where('uid', '==', uid)
      .where('status', '==', 'pending')
      .get();

    sendSuccess(res, { profile: safeData, hasPendingIdCardRequest: !pendingIdCard.empty });
  } catch (error) {
    sendError(res, error.message);
  }
};

const savePushToken = async (req, res) => {
  try {
    const { expoPushToken } = req.body;
    const uid = req.user?.uid || req.uid;

    if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken')) {
      return sendError(res, 'Invalid push token', 400);
    }

    await admin.firestore().collection('users').doc(uid).update({
      expoPushToken,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    sendSuccess(res, { message: 'Push token saved successfully.' });
  } catch (error) {
    sendError(res, error.message);
  }
};



const HOD_EMAIL = 'shahiduddin153@gmail.com';

const reportRagging = async (req, res) => {
  try {
    const { incidentDate, incidentTime, location, description, bullyDescription, isAnonymous } = req.body;
    const uid = req.user?.uid || req.uid;

    if (!incidentDate || !location || !description) {
      return sendError(res, 'Date, location and description are required.', 400);
    }

    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) return sendError(res, 'User not found', 404);

    const userData = userDoc.data();

    if (userData.role !== 'student') {
      return sendError(res, 'Only students can report ragging.', 403);
    }

    const reporterInfo = isAnonymous
      ? { name: 'Anonymous', email: 'Anonymous', rollNumber: 'Hidden', branch: 'Hidden', year: 'Hidden' }
      : {
          name: userData.fullName || 'Unknown',
          email: userData.email || 'Unknown',
          rollNumber: userData.rollNumber || 'N/A',
          branch: userData.branch || 'N/A',
          year: userData.year || 'N/A',
        };

    
    const docRef = await admin.firestore().collection('raggingReports').add({
      uid: isAnonymous ? 'anonymous' : uid,
      isAnonymous,
      reporter: reporterInfo,
      incidentDate,
      incidentTime: incidentTime || 'Not specified',
      location,
      description: description.trim(),
      bullyDescription: bullyDescription?.trim() || 'Not provided',
      status: 'open',
      reportedAt: admin.firestore.Timestamp.now(),
    });

    
    const { sendRaggingReportEmail } = require('../services/emailService');
    await sendRaggingReportEmail(HOD_EMAIL, {
      reportId: docRef.id,
      isAnonymous,
      reporter: reporterInfo,
      incidentDate,
      incidentTime: incidentTime || 'Not specified',
      location,
      description: description.trim(),
      bullyDescription: bullyDescription?.trim() || 'Not provided',
    });

logger.info('[Auth] Ragging report submitted', { uid, isAnonymous });
    sendSuccess(res, { message: 'Ragging report submitted successfully. HOD has been notified.' });
  } catch (error) {
    logger.error('[Auth] reportRagging failed', { error: error.message });
    sendError(res, error.message);
  }
};

module.exports = {
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
  reportRagging,
};