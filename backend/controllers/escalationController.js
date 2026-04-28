const admin = require('../config/firebase');
const { sendSuccess, sendError } = require('../utils/response');
const { getTransporter } = require('../config/nodemailer');
const logger = require('../services/logger');
const { ESCALATION_LIMITS, NO_ACCEPTANCE_LIMITS, HOD_EMAIL_DELAY } = require('../config/escalationLimits');

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function cleanLocation(complaint) {

  const raw = `${complaint.building || ''}, ${complaint.roomDetail || ''}`;
  return raw
    .replace(/\s*—\s*/g, ', ')   
    .replace(/\s*\/\s*/g, ' ')   
    .replace(/,\s*,/g, ',')   
    .replace(/\b(\w+)(,\s*\1)+\b/gi, '$1') 
    .replace(/\s+/g, ' ')        
    .trim()
    .replace(/^,|,$/g, '');     
}

function formatElapsed(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

function toDate(val) {
  if (!val) return null;
  if (val.toDate) return val.toDate();
  if (val._seconds) return new Date(val._seconds * 1000);
  return new Date(val);
}

async function sendEscalationHODEmail(complaint) {
  const transporter = getTransporter();
  const acceptedAt = toDate(complaint.acceptedAt);
  const flaggedAt = toDate(complaint.flaggedAt);
  const createdAt = toDate(complaint.createdAt);
  const elapsed = formatElapsed(Date.now() - (acceptedAt ? acceptedAt.getTime() : createdAt ? createdAt.getTime() : Date.now()));

  await transporter.sendMail({
    from: `"UNIFIX" <${process.env.EMAIL_USER}>`,
    to: process.env.HOD_EMAIL,
subject: `UNIFIX: Unresolved Complaint – ${capitalize(complaint.category)} Issue at ${cleanLocation(complaint)}`,    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr><td style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;">UNIFIX</p>
<p style="margin:4px 0 0;font-size:12px;color:#94a3b8;text-transform:uppercase;">Campus Complaint Management, VCET</p>
          <td align="right"><div style="background:#dc2626;border-radius:8px;padding:8px 14px;">
            <p style="margin:0;font-size:11px;font-weight:700;color:#ffffff;text-transform:uppercase;">ESCALATED</p>
          </div></td>
        </tr></table>
      </td></tr>
      <tr><td style="background:#b91c1c;padding:20px 32px;">
        <p style="margin:0;font-size:16px;font-weight:700;color:#ffffff;">Unresolved Complaint Alert</p>
        <p style="margin:6px 0 0;font-size:13px;color:#fecaca;">Reason: ${complaint.flagReason === 'no_acceptance' ? 'No staff accepted this complaint' : 'Complaint not resolved in time'}${complaint.adminHandling ? ' (Admin was notified and took ownership but did not resolve)' : ''}</p>
      </td></tr>
      <tr><td style="background:#ffffff;padding:28px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;margin-bottom:24px;">
          <tr><td style="padding:10px 14px;background:#ffffff;border-bottom:1px solid #f1f5f9;">
            <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:3px;">Complaint ID</span>
            <span style="font-size:13px;font-weight:700;color:#16a34a;font-family:monospace;">${complaint.id}</span>
          </td></tr>
          <tr><td style="padding:10px 14px;background:#f8fafc;border-bottom:1px solid #f1f5f9;">
            <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:3px;">Category</span>
            <span style="font-size:13px;font-weight:600;color:#0f172a;">${complaint.category || 'N/A'}</span>
          </td></tr>
          <tr><td style="padding:10px 14px;background:#ffffff;border-bottom:1px solid #f1f5f9;">
            <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:3px;">Location</span>
<span style="font-size:13px;font-weight:600;color:#0f172a;">${cleanLocation(complaint)}</span>          </td></tr>
          <tr><td style="padding:10px 14px;background:#f8fafc;border-bottom:1px solid #f1f5f9;">
            <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:3px;">Description</span>
            <span style="font-size:13px;font-weight:600;color:#0f172a;">${complaint.description || 'N/A'}</span>
          </td></tr>
          <tr><td style="padding:10px 14px;background:#ffffff;border-bottom:1px solid #f1f5f9;">
            <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:3px;">Submitted By</span>
            <span style="font-size:13px;font-weight:600;color:#0f172a;">${complaint.submittedByName || 'N/A'} (${complaint.submittedByRole || 'N/A'})</span>
          </td></tr>
          <tr><td style="padding:10px 14px;background:#f8fafc;border-bottom:1px solid #f1f5f9;">
            <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:3px;">Submitted At</span>
            <span style="font-size:13px;font-weight:600;color:#0f172a;">${createdAt ? createdAt.toLocaleString('en-IN') : 'N/A'}</span>
          </td></tr>
          <tr><td style="padding:10px 14px;background:#ffffff;border-bottom:1px solid #f1f5f9;">
            <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:3px;">Assigned To</span>
            <span style="font-size:13px;font-weight:600;color:#0f172a;">${complaint.assignedToName || 'Not assigned'}</span>
          </td></tr>
          <tr><td style="padding:10px 14px;background:#f8fafc;border-bottom:1px solid #f1f5f9;">
            <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:3px;">Admin Handling</span>
            <span style="font-size:13px;font-weight:600;color:#0f172a;">${complaint.adminHandling ? 'Yes — Admin took ownership but did not resolve' : 'No'}</span>
          </td></tr>
          <tr><td style="padding:10px 14px;background:#ffffff;border-bottom:1px solid #f1f5f9;">
            <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:3px;">Time Elapsed</span>
            <span style="font-size:13px;font-weight:700;color:#dc2626;">${elapsed}</span>
          </td></tr>
          <tr><td style="padding:10px 14px;background:#f8fafc;">
            <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:3px;">Flagged At</span>
            <span style="font-size:13px;font-weight:600;color:#0f172a;">${flaggedAt ? flaggedAt.toLocaleString('en-IN') : 'N/A'}</span>
          </td></tr>
        </table>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;">
          <p style="margin:0;font-size:12px;color:#991b1b;line-height:1.6;">This complaint was not resolved within the required time limit. Please take immediate action.</p>
        </div>
      </td></tr>
      <tr><td style="background:#f8fafc;padding:16px 32px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none;">
<p style="margin:0;font-size:11px;color:#94a3b8;">UNIFIX, Vidyavardhini's College of Engineering & Technology</p>        <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1;">Automated notification. Do not reply.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  });
}

async function sendHODResolutionEmail(complaint, resolvedBy) {
  const transporter = getTransporter();
  const createdAt = toDate(complaint.createdAt);
  const flaggedAt = toDate(complaint.flaggedAt);
  const resolvedAt = toDate(complaint.flagResolvedAt) || new Date();

  await transporter.sendMail({
    from: `"UNIFIX" <${process.env.EMAIL_USER}>`,
    to: process.env.HOD_EMAIL,
subject: `UNIFIX: Complaint Resolved – ${capitalize(complaint.category)} Issue at ${cleanLocation(complaint)}`,    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr><td style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;">UNIFIX</p>
        <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;text-transform:uppercase;">Campus Complaint Management, VCET</p></td>
          <td align="right"><div style="background:#16a34a;border-radius:8px;padding:8px 14px;">
            <p style="margin:0;font-size:11px;font-weight:700;color:#ffffff;text-transform:uppercase;">RESOLVED</p>
          </div></td>
        </tr></table>
      </td></tr>
      <tr><td style="background:#15803d;padding:20px 32px;">
        <p style="margin:0;font-size:16px;font-weight:700;color:#ffffff;">Flagged Complaint Has Been Resolved</p>
        <p style="margin:6px 0 0;font-size:13px;color:#bbf7d0;">Resolved by: ${resolvedBy === 'admin' ? 'Admin' : 'Maintenance Staff'}</p>
      </td></tr>
      <tr><td style="background:#ffffff;padding:28px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;margin-bottom:24px;">
          <tr><td style="padding:10px 14px;background:#ffffff;border-bottom:1px solid #f1f5f9;">
            <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:3px;">Complaint ID</span>
            <span style="font-size:13px;font-weight:700;color:#16a34a;font-family:monospace;">${complaint.id}</span>
          </td></tr>
          <tr><td style="padding:10px 14px;background:#f8fafc;border-bottom:1px solid #f1f5f9;">
            <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:3px;">Category</span>
            <span style="font-size:13px;font-weight:600;color:#0f172a;">${complaint.category || 'N/A'}</span>
          </td></tr>
          <tr><td style="padding:10px 14px;background:#ffffff;border-bottom:1px solid #f1f5f9;">
            <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:3px;">Location</span>
<span style="font-size:13px;font-weight:600;color:#0f172a;">${cleanLocation(complaint)}</span>          <tr><td style="padding:10px 14px;background:#f8fafc;border-bottom:1px solid #f1f5f9;">
            <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:3px;">Description</span>
            <span style="font-size:13px;font-weight:600;color:#0f172a;">${complaint.description || 'N/A'}</span>
          </td></tr>
          <tr><td style="padding:10px 14px;background:#ffffff;border-bottom:1px solid #f1f5f9;">
            <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:3px;">Submitted By</span>
            <span style="font-size:13px;font-weight:600;color:#0f172a;">${complaint.submittedByName || 'N/A'} (${complaint.submittedByRole || 'N/A'})</span>
          </td></tr>
          <tr><td style="padding:10px 14px;background:#f8fafc;border-bottom:1px solid #f1f5f9;">
            <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:3px;">Submitted At</span>
            <span style="font-size:13px;font-weight:600;color:#0f172a;">${createdAt ? createdAt.toLocaleString('en-IN') : 'N/A'}</span>
          </td></tr>
          <tr><td style="padding:10px 14px;background:#ffffff;border-bottom:1px solid #f1f5f9;">
            <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:3px;">Flagged At</span>
            <span style="font-size:13px;font-weight:600;color:#0f172a;">${flaggedAt ? flaggedAt.toLocaleString('en-IN') : 'N/A'}</span>
          </td></tr>
          <tr><td style="padding:10px 14px;background:#f8fafc;border-bottom:1px solid #f1f5f9;">
            <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:3px;">Resolved By</span>
            <span style="font-size:13px;font-weight:700;color:#16a34a;">${resolvedBy === 'admin' ? 'Admin' : 'Maintenance Staff'}</span>
          </td></tr>
          <tr><td style="padding:10px 14px;background:#ffffff;">
            <span style="display:block;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:3px;">Resolved At</span>
            <span style="font-size:13px;font-weight:600;color:#16a34a;">${resolvedAt.toLocaleString('en-IN')}</span>
          </td></tr>
        </table>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;">
          <p style="margin:0;font-size:12px;color:#166534;line-height:1.6;">This flagged complaint has been successfully resolved. No further action is required.</p>
        </div>
      </td></tr>
      <tr><td style="background:#f8fafc;padding:16px 32px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">UNIFIX, Vidyavardhini's College of Engineering & Technology</p>
        <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1;">Automated notification. Do not reply.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  });
}

async function notifyStudent(submittedBy, title, body, data) {
  if (!submittedBy) return;
  const studentSnap = await admin.firestore().collection('users').doc(submittedBy).get();
  const token = studentSnap.exists ? studentSnap.data().expoPushToken : null;
  if (!token || !token.startsWith('ExponentPushToken')) return;
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([{ to: token, title, body, data, sound: 'default' }]),
  });
}

async function processComplaint(complaint, limit, now, batch, emailPromises, notifyPromises, adminTokens) {
  const ref = admin.firestore().collection('complaints').doc(complaint.id);

  const startTime = complaint.acceptedAt
    ? toDate(complaint.acceptedAt)
    : toDate(complaint.createdAt);

  if (!startTime) return { flagged: false, emailSent: false };

  const elapsed = now - startTime.getTime();
  let flaggedNow = false;
  let emailSentNow = false;

  if (elapsed > limit && !complaint.flagged) {
    batch.update(ref, {
      flagged: true,
      flaggedAt: admin.firestore.Timestamp.now(),
      flagReason: complaint.acceptedAt ? 'unresolved' : 'no_acceptance',
      flagResolved: false,
      adminHandling: false,
      hodEmailSent: false,
      hodResolutionEmailSent: false,
    });
flaggedNow = true;
    const { scheduleHodEmail } = require('../services/schedulerService');
    scheduleHodEmail(complaint.id);

    if (adminTokens.length > 0) {
      const reason = complaint.acceptedAt
        ? 'has not been resolved in time'
        : 'has not been accepted by any staff';
      notifyPromises.push(
        fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            adminTokens.map(token => ({
              to: token,
              title: 'Complaint Flagged',
              body: `${complaint.category} complaint from ${complaint.submittedByName || 'a student'} ${reason}.`,
              data: { type: 'escalation', complaintId: complaint.id },
              sound: 'default',
            }))
          ),
        })
      );
    }
  }

  if (complaint.flagged && !complaint.flagResolved && !complaint.hodEmailSent) {
    const flaggedAt = toDate(complaint.flaggedAt);
    if (flaggedAt && (now - flaggedAt.getTime()) > HOD_EMAIL_DELAY) {
      batch.update(ref, {
        hodEmailSent: true,
        hodEmailSentAt: admin.firestore.Timestamp.now(),
      });
      emailSentNow = true;
      emailPromises.push(sendEscalationHODEmail(complaint));
      notifyPromises.push(notifyStudent(
        complaint.submittedBy,
        'Complaint Escalated to HOD',
        'Your complaint has been escalated to the HOD due to delay in resolution.',
        { type: 'complaint_escalated', complaintId: complaint.id }
      ));
    }
  }

  if (complaint.flagged && complaint.flagResolved && !complaint.hodResolutionEmailSent) {
    batch.update(ref, { hodResolutionEmailSent: true });
    emailSentNow = true;
    emailPromises.push(sendHODResolutionEmail(complaint, complaint.flagResolvedBy));
  }

  return { flagged: flaggedNow, emailSent: emailSentNow };
}

async function checkEscalations(req, res) {
  try {
    let flaggedCount = 0;
    let emailsSentCount = 0;
    const now = Date.now();

    const adminSnap = await admin.firestore()
      .collection('users')
      .where('role', '==', 'admin')
      .get();

    const adminTokens = adminSnap.docs
      .map(d => d.data().expoPushToken)
      .filter(t => t && t.startsWith('ExponentPushToken'));

    const batch = admin.firestore().batch();
    const emailPromises = [];
    const notifyPromises = [];

    const [assignedSnapshot, pendingSnapshot] = await Promise.all([
      admin.firestore()
        .collection('complaints')
        .where('status', 'in', ['assigned', 'in_progress'])
        .get(),
      admin.firestore()
        .collection('complaints')
        .where('status', '==', 'pending')
        .get(),
    ]);

for (const docSnap of assignedSnapshot.docs) {
      const complaint = { id: docSnap.id, ...docSnap.data() };
     const limit = ESCALATION_LIMITS[complaint.category?.toLowerCase()];
if (!limit) continue;
      const result = await processComplaint(complaint, limit, now, batch, emailPromises, notifyPromises, adminTokens);
      if (result.flagged) flaggedCount++;
      if (result.emailSent) emailsSentCount++;
    }

    for (const docSnap of pendingSnapshot.docs) {
      const complaint = { id: docSnap.id, ...docSnap.data() };
    const limit = NO_ACCEPTANCE_LIMITS[complaint.category?.toLowerCase()];
if (!limit) continue;
      const result = await processComplaint(complaint, limit, now, batch, emailPromises, notifyPromises, adminTokens);
      if (result.flagged) flaggedCount++;
      if (result.emailSent) emailsSentCount++;
    }

await batch.commit();
    await Promise.allSettled([...emailPromises, ...notifyPromises]);

    logger.info('[Escalation] Check complete', { flagged: flaggedCount, emailsSent: emailsSentCount });
    sendSuccess(res, { flagged: flaggedCount, emailsSent: emailsSentCount });
  } catch (error) {
    logger.error('[Escalation] checkEscalations failed', { error: error.message });
    sendError(res, error.message);
  }
}


module.exports = { checkEscalations, sendHODResolutionEmail, sendEscalationHODEmail };