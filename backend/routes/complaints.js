const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { submitComplaintValidator, rateComplaintValidator } = require('../validators/complaintValidator');
const { submit, accept, updateStatus, reject, rate, myComplaints, staffComplaints, allComplaints } = require('../controllers/complaintController');

router.post('/submit', verifyToken, submitComplaintValidator, submit);
router.post('/accept', verifyToken, accept);
router.post('/update-status', verifyToken, updateStatus);
router.post('/reject', verifyToken, reject);
router.post('/rate', verifyToken, rateComplaintValidator, rate);
router.get('/my-complaints', verifyToken, myComplaints);
router.get('/staff-complaints', verifyToken, staffComplaints);
router.get('/all', verifyToken, allComplaints);

module.exports = router;