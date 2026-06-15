const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { submitComplaintValidator, rateComplaintValidator } = require('../validators/complaintValidator');
const { submit, accept, updateStatus, reject, rate, myComplaints, staffComplaints, allComplaints } = require('../controllers/complaintController');
// const { complaintLimiter } = require('../middleware/rateLimiter');

router.post('/submit', verifyToken, submitComplaintValidator, submit);
router.post('/accept', verifyToken, accept);
router.post('/update-status', verifyToken, updateStatus);
router.post('/reject', verifyToken, reject);
router.post('/rate', verifyToken, rateComplaintValidator, rate);
router.get('/my-complaints', verifyToken, myComplaints);
router.get('/my-complaints/hash', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const snapshot = await require('../config/firebase').firestore()
      .collection('complaints')
      .where('submittedBy', '==', uid)
      .orderBy('updatedAt', 'desc')
      .limit(1)
      .get();
    const count = (await require('../config/firebase').firestore()
      .collection('complaints')
      .where('submittedBy', '==', uid)
      .count()
      .get()).data().count;
    const latest = snapshot.empty ? 0 : (snapshot.docs[0].data().updatedAt?._seconds || 0);
    res.json({ hash: `${count}_${latest}`, serverTime: Date.now() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router.get('/staff-complaints', verifyToken, staffComplaints);
router.get('/staff-complaints/hash', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const db = require('../config/firebase').firestore();
    const [pendingSnap, assignedSnap, rejectedSnap] = await Promise.all([
      db.collection('complaints').where('assignableTo', 'array-contains', uid).where('status', '==', 'pending').orderBy('updatedAt', 'desc').limit(1).get(),
      db.collection('complaints').where('assignedTo', '==', uid).orderBy('updatedAt', 'desc').limit(1).get(),
      db.collection('complaints').where('rejectedByUids', 'array-contains', uid).orderBy('updatedAt', 'desc').limit(1).get(),
    ]);
    const latest = Math.max(
      pendingSnap.empty ? 0 : (pendingSnap.docs[0].data().updatedAt?._seconds || 0),
      assignedSnap.empty ? 0 : (assignedSnap.docs[0].data().updatedAt?._seconds || 0),
      rejectedSnap.empty ? 0 : (rejectedSnap.docs[0].data().updatedAt?._seconds || 0),
    );
    const [pc, ac, rc] = await Promise.all([
      db.collection('complaints').where('assignableTo', 'array-contains', uid).where('status', '==', 'pending').count().get(),
      db.collection('complaints').where('assignedTo', '==', uid).count().get(),
      db.collection('complaints').where('rejectedByUids', 'array-contains', uid).count().get(),
    ]);
    const total = pc.data().count + ac.data().count + rc.data().count;
    res.json({ hash: `${total}_${latest}`, serverTime: Date.now() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router.get('/all', verifyToken, allComplaints);

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const db = require('../config/firebase').firestore();
    const doc = await db.collection('complaints').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;