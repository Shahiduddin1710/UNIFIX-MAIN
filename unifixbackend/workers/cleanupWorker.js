const { Worker } = require('bullmq');
const redis = require('../config/redis');
const admin = require('../config/firebase');
const logger = require('../services/logger');


const THREE_MONTHS_MS = 3 * 30 * 24 * 60 * 60 * 1000;

const worker = new Worker(
  'cleanup',
  async (job) => {
    if (job.name !== 'daily-cleanup') return;

    const db = admin.firestore();
    const now = Date.now();
  
    let deletedLostItems = 0;

let batch = db.batch();
    let count = 0;

    //Delete lost reports older than 3 months
    const threeMonthsAgo = admin.firestore.Timestamp.fromMillis(now - THREE_MONTHS_MS);
    const oldLostReports = await db
      .collection('lost_reports')
      .where('postedAt', '<', threeMonthsAgo)
      .get();

    batch = db.batch();
    count = 0;
    for (const doc of oldLostReports.docs) {
      batch.delete(doc.ref);
      count++;
      if (count === 500) {
        await batch.commit();
        batch = db.batch();
        count = 0;
      }
    }
    if (count > 0) await batch.commit();
    deletedLostItems += oldLostReports.size;

    // Delete found items older than 3 months
    const oldFoundItems = await db
      .collection('lostFound')
      .where('createdAt', '<', threeMonthsAgo)
      .where('status', '==', 'handed_over')
      .get();

    batch = db.batch();
    count = 0;
    for (const doc of oldFoundItems.docs) {
      batch.delete(doc.ref);
      count++;
      if (count === 500) {
        await batch.commit();
        batch = db.batch();
        count = 0;
      }
    }
    if (count > 0) await batch.commit();
    deletedLostItems += oldFoundItems.size;

    logger.info('[Cleanup] Daily cleanup complete', { deletedLostItems });
  },
  { connection: redis, concurrency: 1 }
);

worker.on('completed', (job) => logger.info(`[Cleanup] Job ${job.id} completed`));
worker.on('failed', (job, err) => {
  logger.error(`[Cleanup] Job ${job.id} failed: ${err.message}`);
  const Sentry = require('@sentry/node');
  Sentry.captureException(err, { extra: { jobId: job.id, jobName: job.name } });
});

module.exports = worker;