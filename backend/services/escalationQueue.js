const { Queue } = require('bullmq');
const redis = require('../config/redis');

const escalationQueue = new Queue('escalation', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 100,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

async function scheduleEscalation(complaintId, category, startTime) {
  const ESCALATION_LIMITS = {
    cleaning: 1 * 60 * 1000,
    housekeeping: 1 * 60 * 1000,
    washroom: 1 * 60 * 1000,
    electrical: 1 * 60 * 1000,
    plumbing: 1 * 60 * 1000,
    civil: 1 * 60 * 1000,
    carpentry: 1 * 60 * 1000,
    technician: 1 * 60 * 1000,
    'it / technical': 1 * 60 * 1000,
    lab: 1 * 60 * 1000,
    safety: 1 * 60 * 1000,
    others: 1 * 60 * 1000,
  };

  const limit = ESCALATION_LIMITS[category?.toLowerCase()];
  if (!limit) return;

  const elapsed = Date.now() - startTime;
  const remaining = Math.max(limit - elapsed, 0);

  await escalationQueue.add(
    'flag-complaint',
    { complaintId, category },
    { delay: remaining, jobId: `escalate-${complaintId}`, removeOnComplete: true }
  );
}

async function scheduleHodEmail(complaintId) {
  const HOD_DELAY = 20 * 1000;
  await escalationQueue.add(
    'hod-email',
    { complaintId },
    { delay: HOD_DELAY, jobId: `hod-${complaintId}`, removeOnComplete: true }
  );
}

async function cancelEscalation(complaintId) {
  try {
    const j1 = await escalationQueue.getJob(`escalate-${complaintId}`);
    const j2 = await escalationQueue.getJob(`hod-${complaintId}`);
    if (j1) await j1.remove();
    if (j2) await j2.remove();
  } catch (err) {
    console.error(`[Queue] Cancel failed for ${complaintId}:`, err.message);
  }
}

module.exports = { escalationQueue, scheduleEscalation, scheduleHodEmail, cancelEscalation };