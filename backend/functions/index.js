const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const getTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER || functions.config().email?.user || "unifixofficial365@gmail.com",
      pass: process.env.EMAIL_PASSWORD || functions.config().email?.password || "lljtbetpphkbfsna"
    }
  });
};

exports.sendOTPEmail = functions.https.onCall(async (data, context) => {
  const { email, otp, fullName, type } = data;

  if (!email || !otp || !fullName || !type) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields: email, otp, fullName, type");
  }

  let subject = "";
  let htmlContent = "";

  if (type === "email-verification") {
    subject = "UNIFIX - Email Verification OTP";
    htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #f9fafb; padding: 20px; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #10b981; margin: 0;">UNIFIX</h2>
          <p style="color: #6b7280; margin-top: 5px;">Campus Complaint Management</p>
        </div>
        <p style="color: #1f2937; font-size: 14px;">Hello ${fullName},</p>
        <p style="color: #1f2937; font-size: 14px;">Your OTP for email verification is:</p>
        <div style="background: #10b981; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="color: #ffffff; letter-spacing: 5px; font-size: 36px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #1f2937; font-size: 14px;">This OTP will expire in 10 minutes.</p>
        <p style="color: #6b7280; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px; text-align: center;">UNIFIX Campus Complaint Management System</p>
      </div>
    `;
  } else if (type === "password-reset") {
    subject = "UNIFIX - Password Reset OTP";
    htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #f9fafb; padding: 20px; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #10b981; margin: 0;">UNIFIX</h2>
          <p style="color: #6b7280; margin-top: 5px;">Campus Complaint Management</p>
        </div>
        <p style="color: #1f2937; font-size: 14px;">Hello ${fullName},</p>
        <p style="color: #1f2937; font-size: 14px;">Your OTP for password reset is:</p>
        <div style="background: #10b981; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="color: #ffffff; letter-spacing: 5px; font-size: 36px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #1f2937; font-size: 14px;">This OTP will expire in 10 minutes.</p>
        <p style="color: #6b7280; font-size: 12px;">If you didn't request a password reset, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px; text-align: center;">UNIFIX Campus Complaint Management System</p>
      </div>
    `;
  } else {
    throw new functions.https.HttpsError("invalid-argument", "Invalid type. Must be email-verification or password-reset");
  }

  const mailOptions = {
    from: '"UNIFIX" <unifixofficial365@gmail.com>',
    to: email,
    subject: subject,
    html: htmlContent
  };

  try {
    const transporter = getTransporter();
    await transporter.sendMail(mailOptions);
    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new functions.https.HttpsError("internal", "Failed to send email: " + error.message);
  }
});

exports.storeOTP = functions.https.onCall(async (data, context) => {
  const { email, otp, type } = data;
  const otpType = type || "email-verification";

  if (!email || !otp) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields: email, otp");
  }

  const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

  try {
    await admin.firestore().collection("otps").doc(email).set({
      otp: String(otp),
      type: otpType,
      expiresAt: admin.firestore.Timestamp.fromDate(expiryTime),
      createdAt: admin.firestore.Timestamp.now()
    });
    return { success: true, message: "OTP stored successfully" };
  } catch (error) {
    console.error("Error storing OTP:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

exports.verifyOTP = functions.https.onCall(async (data, context) => {
  const { email, otp, type } = data;
  const otpType = type || "email-verification";

  if (!email || !otp) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields: email, otp");
  }

  try {
    const otpDoc = await admin.firestore().collection("otps").doc(email).get();

    if (!otpDoc.exists) {
      throw new functions.https.HttpsError("not-found", "OTP not found or expired");
    }

    const otpData = otpDoc.data();

    if (otpData.type !== otpType) {
      throw new functions.https.HttpsError("failed-precondition", "OTP type mismatch");
    }

    if (String(otpData.otp) !== String(otp)) {
      throw new functions.https.HttpsError("unauthenticated", "Invalid OTP");
    }

    const currentTime = new Date();
    if (currentTime > otpData.expiresAt.toDate()) {
      throw new functions.https.HttpsError("failed-precondition", "OTP has expired");
    }

    return { success: true, message: "OTP verified successfully" };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    console.error("Error verifying OTP:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

exports.deleteOTP = functions.https.onCall(async (data, context) => {
  const { email } = data;

  if (!email) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required field: email");
  }

  try {
    await admin.firestore().collection("otps").doc(email).delete();
    return { success: true, message: "OTP deleted successfully" };
  } catch (error) {
    console.error("Error deleting OTP:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

exports.getUserData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User not authenticated");
  }

  const uid = context.auth.uid;

  try {
    const userDoc = await admin.firestore().collection("users").doc(uid).get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError("not-found", "User not found");
    }

    return { success: true, data: userDoc.data() };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    console.error("Error getting user data:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

exports.updateUserProfile = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User not authenticated");
  }

  const uid = context.auth.uid;
  const { year, branch, department, phone, employeeId, designation } = data;

  const updateData = {
    profileCompleted: true,
    updatedAt: admin.firestore.Timestamp.now()
  };

  if (phone !== undefined && phone !== null && phone !== "") updateData.phone = phone;
  if (year !== undefined && year !== null && year !== "") updateData.year = year;
  if (branch !== undefined && branch !== null && branch !== "") updateData.branch = branch;
  if (department !== undefined && department !== null && department !== "") updateData.department = department;
  if (employeeId !== undefined && employeeId !== null && employeeId !== "") updateData.employeeId = employeeId;
  if (designation !== undefined && designation !== null && designation !== "") updateData.designation = designation;

  try {
    await admin.firestore().collection("users").doc(uid).update(updateData);
    return { success: true, message: "Profile updated successfully" };
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});