const admin = require('../config/firebase');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const storeOTPInFirestore = async (email, otp, type) => {
  const otpType = type || 'email-verification';
  const expiryTime = new Date(Date.now() + 10 * 60 * 1000);
  await admin.firestore().collection('otps').doc(email).set({
    otp: String(otp),
    type: otpType,
    expiresAt: admin.firestore.Timestamp.fromDate(expiryTime),
    createdAt: admin.firestore.Timestamp.now(),
  });
};

const verifyOTPFromFirestore = async (email, otp, type) => {
  const otpType = type || 'email-verification';
  if (!email || !otp) return false;
  try {
    const otpRef = admin.firestore().collection('otps').doc(email);
    let isValid = false;

    await admin.firestore().runTransaction(async (transaction) => {
      const otpDoc = await transaction.get(otpRef);
      if (!otpDoc.exists) return;
      const otpData = otpDoc.data();
      if (!otpData?.otp || !otpData?.type || !otpData?.expiresAt) return;
      if (otpData.type !== otpType) return;
      if (String(otpData.otp).trim() !== String(otp).trim()) return;
      if (new Date() > otpData.expiresAt.toDate()) return;
      // Delete inside transaction — second request will find no doc
      transaction.delete(otpRef);
      isValid = true;
    });

    return isValid;
  } catch {
    return false;
  }
};

const deleteOTPFromFirestore = async (email) => {
  if (!email) return;
  try {
    await admin.firestore().collection('otps').doc(email).delete();
  } catch {}
};

module.exports = {
  generateOTP,
  storeOTPInFirestore,
  verifyOTPFromFirestore,
  deleteOTPFromFirestore,
};