const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { post, feed, markFound, deleteReport } = require('../controllers/lostReportController');
// const { lostReportLimiter } = require('../middleware/rateLimiter');

router.post('/post', verifyToken, post);
router.get('/feed', verifyToken, feed);
router.patch('/:id/found', verifyToken, markFound);
router.delete('/:id', verifyToken, deleteReport);

router.get('/feed/hash', verifyToken, async (req, res) => {
  try {
    const admin = require('../config/firebase');
    const [byUpdated, byPosted, countSnap] = await Promise.all([
      admin.firestore()
        .collection('lost_reports')
        .orderBy('updatedAt', 'desc')
        .limit(1)
        .get(),
      admin.firestore()
        .collection('lost_reports')
        .orderBy('postedAt', 'desc')
        .limit(1)
        .get(),
      admin.firestore().collection('lost_reports').count().get(),
    ]);
    const count = countSnap.data().count;
    const latestUpdated = byUpdated.empty ? 0 : (byUpdated.docs[0].data().updatedAt?._seconds || 0);
    const latestPosted = byPosted.empty ? 0 : (byPosted.docs[0].data().postedAt?._seconds || 0);
    const latest = Math.max(latestUpdated, latestPosted);
    res.json({ hash: `${count}_${latest}`, serverTime: Date.now() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;