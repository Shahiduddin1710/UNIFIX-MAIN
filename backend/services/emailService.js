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

async function sendRaggingReportEmail(hodEmail, report) {
  const transporter = getTransporter();

  const reporterRows = report.isAnonymous
    ? `
      <tr>
        <td style="padding:10px 14px;background:#fff5f5;border-bottom:1px solid #fee2e2;">
          <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">Reporter</span>
          <span style="font-size:13px;font-weight:700;color:#dc2626;">ANONYMOUS SUBMISSION</span>
        </td>
      </tr>`
    : `
      <tr>
        <td style="padding:10px 14px;background:#ffffff;border-bottom:1px solid #f1f5f9;">
          <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">Student Name</span>
          <span style="font-size:13px;font-weight:600;color:#0f172a;">${report.reporter.name}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 14px;background:#f8fafc;border-bottom:1px solid #f1f5f9;">
          <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">Email Address</span>
          <span style="font-size:12px;font-weight:600;color:#0f172a;word-break:break-all;">${report.reporter.email}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 14px;background:#ffffff;border-bottom:1px solid #f1f5f9;">
          <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">Roll Number</span>
          <span style="font-size:13px;font-weight:600;color:#0f172a;">${report.reporter.rollNumber}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 14px;background:#f8fafc;border-bottom:1px solid #f1f5f9;">
          <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">Branch</span>
          <span style="font-size:13px;font-weight:600;color:#0f172a;">${report.reporter.branch}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 14px;background:#ffffff;border-bottom:1px solid #f1f5f9;">
          <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">Year</span>
          <span style="font-size:13px;font-weight:600;color:#0f172a;">${report.reporter.year}</span>
        </td>
      </tr>`;

  const incidentRows = `
      <tr>
        <td style="padding:10px 14px;background:#ffffff;border-bottom:1px solid #f1f5f9;">
          <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">Report ID</span>
          <span style="font-size:13px;font-weight:700;color:#16a34a;font-family:monospace;">${report.reportId.slice(0, 10).toUpperCase()}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 14px;background:#f8fafc;border-bottom:1px solid #f1f5f9;">
          <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">Date of Incident</span>
          <span style="font-size:13px;font-weight:600;color:#0f172a;">${report.incidentDate}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 14px;background:#ffffff;border-bottom:1px solid #f1f5f9;">
          <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">Time of Incident</span>
          <span style="font-size:13px;font-weight:600;color:#0f172a;">${report.incidentTime}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 14px;background:#f8fafc;border-bottom:1px solid #f1f5f9;">
          <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">Location</span>
          <span style="font-size:13px;font-weight:600;color:#0f172a;">${report.location}</span>
        </td>
      </tr>`;

  await transporter.sendMail({
    from: `"UNIFIX" <${process.env.EMAIL_USER}>`,
    to: hodEmail,
    subject: `UNIFIX — Ragging Report Received | Immediate Action Required`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- HEADER -->
        <tr>
          <td style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">UNIFIX</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;letter-spacing:0.5px;text-transform:uppercase;">Campus Complaint Management System — VCET</p>
                </td>
                <td align="right">
                  <div style="background:#dc2626;border-radius:8px;padding:8px 14px;display:inline-block;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:0.5px;">URGENT</p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ALERT BANNER -->
        <tr>
          <td style="background:#dc2626;padding:20px 32px;">
            <p style="margin:0;font-size:16px;font-weight:700;color:#ffffff;">Anti-Ragging Complaint Report</p>
            <p style="margin:6px 0 0;font-size:13px;color:#fecaca;">A student has submitted a ragging complaint. Please review and take action within 72 hours as per UGC regulations.</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="background:#ffffff;padding:28px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">

            <!-- SECTION: Reporter -->
            <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.6px;border-left:3px solid #dc2626;padding-left:10px;">Reporter Information</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;margin-bottom:24px;">
              ${reporterRows}
            </table>

            <!-- SECTION: Incident -->
            <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.6px;border-left:3px solid #2563eb;padding-left:10px;">Incident Details</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;margin-bottom:24px;">
              ${incidentRows}
            </table>

            <!-- SECTION: Description -->
            <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.6px;border-left:3px solid #d97706;padding-left:10px;">What Happened</p>
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:24px;">
              <p style="margin:0;font-size:13px;color:#374151;line-height:1.7;">${report.description}</p>
            </div>

            <!-- SECTION: Bully -->
            <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.6px;border-left:3px solid #7c3aed;padding-left:10px;">Person(s) Involved</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:24px;">
              <p style="margin:0;font-size:13px;color:#374151;line-height:1.7;">${report.bullyDescription || 'Not provided'}</p>
            </div>

            <!-- LEGAL NOTE -->
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.4px;">Confidential — Legal Obligation</p>
              <p style="margin:0;font-size:12px;color:#166534;line-height:1.6;">This report is strictly confidential and must be handled as per UGC Anti-Ragging Regulations 2009 and the Maharashtra Prohibition of Ragging Act. Disciplinary action must commence within 72 hours of receipt.</p>
            </div>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;font-size:11px;color:#94a3b8;">UNIFIX Platform — Vidyavardhini's College of Engineering & Technology</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1;">This is an automated notification. Do not reply to this email.</p>
                </td>
                <td align="right">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#dc2626;">CONFIDENTIAL</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`,
  });
}

module.exports = {
  sendOTPEmail,
  sendRejectionEmail,
  sendApprovalEmail,
  sendIdCardRejectionEmail,
  sendRaggingReportEmail,
};