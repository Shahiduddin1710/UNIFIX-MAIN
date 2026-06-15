const { Worker } = require('bullmq');
const redis = require('../config/redis');
const admin = require('../config/firebase');
const logger = require('../services/logger');

const worker = new Worker(
  'escalation',
  async (job) => {
    logger.info(`[Worker] Job received: ${job.name} for ${job.data.complaintId}`);
    const { complaintId } = job.data;
    const db = admin.firestore();
    const ref = db.collection('complaints').doc(complaintId);
    const snap = await ref.get();

    if (!snap.exists) {
      logger.warn(`[Worker] Complaint ${complaintId} not found, skipping`);
      return;
    }

    const complaint = { id: complaintId, ...snap.data() };

    if (complaint.status === 'completed' || complaint.status === 'rejected' || complaint.flagResolved) {
      logger.info(`[Worker] Complaint ${complaintId} already resolved, skipping`);
      return;
    }

    if (job.name === 'flag-complaint' && !complaint.flagged) {
      const adminSnap = await db.collection('users').where('role', '==', 'admin').get();
      const adminTokens = adminSnap.docs
        .map(d => d.data().expoPushToken)
        .filter(t => t && t.startsWith('ExponentPushToken'));

await ref.update({
        flagged: true,
        flaggedAt: admin.firestore.Timestamp.now(),
        flagReason: complaint.acceptedAt ? 'unresolved' : 'no_acceptance',
        flagResolved: false,
        adminHandling: false,
        hodEmailSent: false,
        hodResolutionEmailSent: false,
        updatedAt: admin.firestore.Timestamp.now(),
      });

      if (adminTokens.length > 0) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(adminTokens.map(token => ({
            to: token,
            title: 'Complaint Flagged',
            body: `${complaint.category} complaint from ${complaint.submittedByName || 'a student'} exceeded time limit.`,
            data: { type: 'escalation', complaintId },
            sound: 'default',
          }))),
        });
      }

     const { scheduleHodEmail } = require('../services/schedulerService');
      await scheduleHodEmail(complaintId);

      logger.info(`[Worker] Flagged complaint ${complaintId}`);
      // Hash cleared server-side clients will force re-sync on next poll
    }

    if (job.name === 'hod-email' && complaint.flagged && !complaint.hodEmailSent) {
      const { sendEscalationHODEmail } = require('../controllers/escalationController');
      await sendEscalationHODEmail(complaint);

    await ref.update({
        hodEmailSent: true,
        hodEmailSentAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      });

      logger.info(`[Worker] HOD email sent for complaint ${complaintId}`);
    }
  },
  { connection: redis, concurrency: 5 }
);

worker.on('completed', (job) => logger.info(`[Worker] Job ${job.id} completed`));
worker.on('failed', (job, err) => {
  logger.error(`[Worker] Job ${job.id} failed: ${err.message}`);
  const Sentry = require('@sentry/node');
  Sentry.captureException(err, { extra: { jobId: job.id, jobName: job.name, data: job.data } });
});
worker.on('error', (err) => logger.error(`[Worker] Worker error: ${err.message}`));
worker.on('active', (job) => logger.info(`[Worker] Job active: ${job.id} - ${job.name}`));

module.exports = worker;  