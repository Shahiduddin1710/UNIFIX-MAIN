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
   const normalizedCategory = category?.toLowerCase().trim();
  const limit = ESCALATION_LIMITS[normalizedCategory];
  if (!limit) {
    console.warn(`[Escalation] No limit found for category: "${category}" (normalized: "${normalizedCategory}")`);
    return;
  }

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
    const [delayed, waiting, active] = await Promise.all([
      escalationQueue.getDelayed(),
      escalationQueue.getWaiting(),
      escalationQueue.getActive(),
    ]);
    const allJobs = [...delayed, ...waiting, ...active];
    await Promise.all(
      allJobs
        .filter(job => job.data.complaintId === complaintId)
        .map(job => job.remove())
    );
  } catch (err) {
    console.error(`[Queue] Cancel failed for ${complaintId}:`, err.message);
  }
}

const cleanupQueue = new Queue('cleanup', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 20,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

async function scheduleCleanup() {
  // Run daily at midnight IST (18:30 UTC)
  await cleanupQueue.add(
    'daily-cleanup',
    {},
    {
      repeat: { cron: '30 18 * * *' },
      jobId: 'daily-cleanup',
    }
  );
}

module.exports = { escalationQueue, cleanupQueue, scheduleEscalation, scheduleHodEmail, cancelEscalation, scheduleCleanup };