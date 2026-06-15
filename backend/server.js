const dotenv = require('dotenv');
dotenv.config();

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
require('./config/sentry');
const Sentry = require('@sentry/node');
require('./config/env');

const express = require('express');
const cors = require('cors');
const logger = require('./services/logger');
const { generalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

require('./workers/escalationWorker');
require('./workers/cleanupWorker');

const app = express();
app.use(cors({
 origin: ['https://unifix-admin.vercel.app', 'https://unifixapp.vercel.app', 'http://localhost:5173'],

  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-cron-secret'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(generalLimiter);

app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/adminRoutes'));
app.use('/complaints', require('./routes/complaints'));
app.use('/lost-found', require('./routes/lostFound'));
app.use('/lost-reports', require('./routes/lostReportRoutes'));
app.use('/analytics', require('./routes/analyticsRoutes'));
app.use('/contact', require('./routes/contact'));

app.get('/health', (req, res) =>
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
);

app.get('/test-email', async (req, res) => {
  try {
    const { getTransporter } = require('./config/nodemailer');
    const transporter = getTransporter();
    await transporter.verify();
    res.json({ status: 'OK', user: process.env.EMAIL_USER });
  } catch (err) {
    res.json({ status: 'FAILED', error: err.message });
  }
});


Sentry.setupExpressErrorHandler(app);
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(errorHandler);

const { scheduleCleanup } = require('./services/escalationQueue');
scheduleCleanup().catch(err => logger.error('[Cleanup] Failed to schedule cleanup job', { error: err.message }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app;