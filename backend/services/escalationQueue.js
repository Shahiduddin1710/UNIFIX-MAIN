const { Queue } = require('bullmq');
const redis = require('../config/redis');
const { ESCALATION_LIMITS, HOD_EMAIL_DELAY } = require('../config/escalationLimits');

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
  const limit = ESCALATION_LIMITS[category?.toLowerCase()];
  if (!limit) return;

  const elapsed = Date.now() - startTime;
  const remaining = Math.max(limit - elapsed, 0);

  const uniqueJobId = `escalate-${complaintId}-${Date.now()}`;

  await escalationQueue.add(
    'flag-complaint',
    { complaintId, category },
    { delay: remaining, jobId: uniqueJobId, removeOnComplete: true }
  );
}

async function scheduleHodEmail(complaintId) {
  await escalationQueue.add(
    'hod-email',
    { complaintId },
    { delay: HOD_EMAIL_DELAY, jobId: `hod-${complaintId}-${Date.now()}`, removeOnComplete: true }
  );
}

async function cancelEscalation(complaintId) {
  try {
    const delayed = await escalationQueue.getDelayed();
    for (const job of delayed) {
      if (job.data.complaintId === complaintId) {
        await job.remove();
      }
    }
  } catch (err) {
    console.error(`[Queue] Cancel failed for ${complaintId}:`, err.message);
  }
}

module.exports = { escalationQueue, scheduleEscalation, scheduleHodEmail, cancelEscalation };