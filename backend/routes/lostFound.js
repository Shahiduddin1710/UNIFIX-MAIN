const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { postLostFoundValidator } = require('../validators/complaintValidator');
const { post, feed, handover, myPosts, claims, deletePost } = require('../controllers/lostFoundController');
const admin = require('../config/firebase');
// const { lostReportLimiter } = require('../middleware/rateLimiter');

router.post('/post', verifyToken, postLostFoundValidator, post);
router.get('/feed', verifyToken, feed);
router.post('/handover', verifyToken, handover);
router.get('/my-posts', verifyToken, myPosts);
router.get('/claims', verifyToken, claims);
router.delete('/:id', verifyToken, deletePost);

router.get('/feed/hash', verifyToken, async (req, res) => {
  try {
    const snapshot = await admin.firestore()
      .collection('lostFound')
      .orderBy('updatedAt', 'desc')
      .limit(1)
      .get();
    const count = (await admin.firestore().collection('lostFound').count().get()).data().count;
    const latest = snapshot.empty ? 0 : (snapshot.docs[0].data().updatedAt?._seconds || 0);
    res.json({ hash: `${count}_${latest}`, serverTime: Date.now() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/claims/hash', verifyToken, async (req, res) => {
  try {
    const count = (await admin.firestore().collection('claims').count().get()).data().count;
    res.json({ hash: `${count}`, serverTime: Date.now() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;