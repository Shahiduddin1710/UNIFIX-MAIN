const { getTransporter } = require('../config/nodemailer');

async function sendOTPEmail(email, otp, fullName, type) {
  const otpType = type || 'email-verification';
  const name = fullName || 'User';
  if (!email || !otp) throw new Error('Email and OTP are required');

  let subject, htmlContent;

  if (otpType === 'email-verification') {
    subject = 'UNIFIX - Email Verification OTP';
    htmlContent = `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#f9fafb;padding:20px;border-radius:8px;">
        <div style="text-align:center;margin-bottom:30px;">
          <h2 style="color:#10b981;margin:0;">UNIFIX</h2>
          <p style="color:#6b7280;margin-top:5px;">Campus Complaint Management</p>
        </div>
        <p style="color:#1f2937;font-size:14px;">Hello ${name},</p>
        <p style="color:#1f2937;font-size:14px;">Your OTP for email verification is:</p>
        <div style="background:#10b981;padding:20px;border-radius:8px;text-align:center;margin:20px 0;">
          <h1 style="color:#ffffff;letter-spacing:5px;font-size:36px;margin:0;">${otp}</h1>
        </div>
        <p style="color:#1f2937;font-size:14px;">This OTP will expire in 10 minutes.</p>
        <p style="color:#6b7280;font-size:12px;">If you didn't request this, please ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
        <p style="color:#6b7280;font-size:12px;text-align:center;">UNIFIX Campus Complaint Management System</p>
      </div>`;
  } else if (otpType === 'password-reset') {
    subject = 'UNIFIX - Password Reset OTP';
    htmlContent = `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#f9fafb;padding:20px;border-radius:8px;">
        <div style="text-align:center;margin-bottom:30px;">
          <h2 style="color:#10b981;margin:0;">UNIFIX</h2>
          <p style="color:#6b7280;margin-top:5px;">Campus Complaint Management</p>
        </div>
        <p style="color:#1f2937;font-size:14px;">Hello ${name},</p>
        <p style="color:#1f2937;font-size:14px;">Your OTP for password reset is:</p>
        <div style="background:#10b981;padding:20px;border-radius:8px;text-align:center;margin:20px 0;">
          <h1 style="color:#ffffff;letter-spacing:5px;font-size:36px;margin:0;">${otp}</h1>
        </div>
        <p style="color:#1f2937;font-size:14px;">This OTP will expire in 10 minutes.</p>
        <p style="color:#6b7280;font-size:12px;">If you didn't request a password reset, please ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
        <p style="color:#6b7280;font-size:12px;text-align:center;">UNIFIX Campus Complaint Management System</p>
      </div>`;
  } else {
    throw new Error('Invalid OTP type');
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"UNIFIX" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html: htmlContent,
  });
}

async function sendRejectionEmail(email, fullName, rejectionMessage) {
  if (!email || !rejectionMessage) throw new Error('Email and rejection message are required');
  const name = fullName || 'User';
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"UNIFIX" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'UNIFIX - Profile Verification Update',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#f9fafb;padding:20px;border-radius:8px;">
        <div style="text-align:center;margin-bottom:30px;">
          <h2 style="color:#10b981;margin:0;">UNIFIX</h2>
          <p style="color:#6b7280;margin-top:5px;">Campus Complaint Management</p>
        </div>
        <p style="color:#1f2937;font-size:14px;">Hello ${name},</p>
        <p style="color:#1f2937;font-size:14px;">Your profile verification has been reviewed. Unfortunately, your profile could not be approved at this time.</p>
        <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px;border-radius:4px;margin:20px 0;">
          <p style="color:#991b1b;font-size:13px;font-weight:bold;margin:0 0 6px;">Reason / Action Required:</p>
          <p style="color:#7f1d1d;font-size:14px;margin:0;">${rejectionMessage}</p>
        </div>
        <p style="color:#1f2937;font-size:14px;">Please log in to UNIFIX, update your profile, and resubmit for verification.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
        <p style="color:#6b7280;font-size:12px;text-align:center;">UNIFIX Campus Complaint Management System</p>
      </div>`,
  });
}

async function sendApprovalEmail(email, fullName) {
  if (!email) throw new Error('Email is required');
  const name = fullName || 'User';
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"UNIFIX" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'UNIFIX - Account Approved!',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#f9fafb;padding:20px;border-radius:8px;">
        <div style="text-align:center;margin-bottom:30px;">
          <h2 style="color:#10b981;margin:0;">UNIFIX</h2>
          <p style="color:#6b7280;margin-top:5px;">Campus Complaint Management</p>
        </div>
        <div style="text-align:center;margin:20px 0;font-size:48px;">✅</div>
        <p style="color:#1f2937;font-size:14px;">Hello ${name},</p>
        <p style="color:#1f2937;font-size:14px;">Your profile has been <strong style="color:#10b981;">verified and approved</strong>.</p>
        <p style="color:#1f2937;font-size:14px;">You can now log in to UNIFIX and access your maintenance staff dashboard.</p>
        <div style="background:#ecfdf5;border:1px solid #6ee7b7;padding:16px;border-radius:8px;text-align:center;margin:20px 0;">
          <p style="color:#065f46;font-size:14px;font-weight:bold;margin:0;">Welcome to the UNIFIX maintenance team! 🎉</p>
        </div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
        <p style="color:#6b7280;font-size:12px;text-align:center;">UNIFIX Campus Complaint Management System</p>
      </div>`,
  });
}

async function sendIdCardRejectionEmail(email, fullName, reason) {
  if (!email) throw new Error('Email is required');
  const name = fullName || 'User';
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"UNIFIX" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'UNIFIX - ID Card Update Request Rejected',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#f9fafb;padding:20px;border-radius:8px;">
        <div style="text-align:center;margin-bottom:30px;">
          <h2 style="color:#10b981;margin:0;">UNIFIX</h2>
          <p style="color:#6b7280;margin-top:5px;">Campus Complaint Management</p>
        </div>
        <div style="text-align:center;margin:20px 0;font-size:48px;">🪪</div>
        <p style="color:#1f2937;font-size:14px;">Hello ${name},</p>
        <p style="color:#1f2937;font-size:14px;">Your ID card update request has been <strong style="color:#dc2626;">rejected</strong>.</p>
        <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px;border-radius:4px;margin:20px 0;">
          <p style="color:#991b1b;font-size:13px;font-weight:bold;margin:0 0 6px;">Reason:</p>
          <p style="color:#7f1d1d;font-size:14px;margin:0;">${reason || 'The submitted ID card did not meet the required criteria.'}</p>
        </div>
        <p style="color:#1f2937;font-size:14px;">Please ensure your ID card is clear, official, not expired, and shows your name and ID clearly.</p>
        <p style="color:#1f2937;font-size:14px;">You can resubmit from the <strong>Personal Information</strong> section in the UNIFIX app.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
        <p style="color:#6b7280;font-size:12px;text-align:center;">UNIFIX Campus Complaint Management System</p>
      </div>`,
  });
}

module.exports = {
  sendOTPEmail,
  sendRejectionEmail,
  sendApprovalEmail,
  sendIdCardRejectionEmail,
};