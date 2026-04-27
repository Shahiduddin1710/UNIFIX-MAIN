const express = require('express');
const router = express.Router();
const { verifyAdminToken } = require('../middleware/roleMiddleware');
const { getAnalytics } = require('../controllers/analyticsController');

router.get('/', verifyAdminToken, getAnalytics);

module.exports = router;