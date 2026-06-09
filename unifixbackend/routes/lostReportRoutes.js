const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { post, feed, markFound, deleteReport } = require('../controllers/lostReportController');
const { lostReportLimiter } = require('../middleware/rateLimiter');

router.post('/post', verifyToken, lostReportLimiter, post);
router.get('/feed', verifyToken, feed);
router.patch('/:id/found', verifyToken, markFound);
router.delete('/:id', verifyToken, deleteReport);

module.exports = router;