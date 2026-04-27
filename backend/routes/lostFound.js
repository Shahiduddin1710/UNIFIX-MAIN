const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { postLostFoundValidator } = require('../validators/complaintValidator');
const { post, feed, handover, myPosts, claims } = require('../controllers/lostFoundController');

router.post('/post', verifyToken, postLostFoundValidator, post);
router.get('/feed', verifyToken, feed);
router.post('/handover', verifyToken, handover);
router.get('/my-posts', verifyToken, myPosts);
router.get('/claims', verifyToken, claims);

module.exports = router;