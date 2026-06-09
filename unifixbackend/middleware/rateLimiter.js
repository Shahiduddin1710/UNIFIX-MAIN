const { default: rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis = require('../config/redis');

const userOrIpKey = (req) => req.user?.uid || ipKeyGenerator(req);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: ipKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts. Please try again later.' },
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.body?.email || ipKeyGenerator(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many OTP requests. Please wait 10 minutes.' },
});

const complaintLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'complaint:',
  }),
  windowMs: 24 * 60 * 60 * 1000,
  max: 10,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.user?.role === 'admin',
  handler: (req, res) => {
    res.status(429).json({
      error: 'You can only submit 10 complaints per day.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
    });
  },
});

const lostReportLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'lostreport:',
  }),
  windowMs: 24 * 60 * 60 * 1000,
  max: 10,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many lost reports submitted. Please wait 24 hours.' },
});

module.exports = { generalLimiter, authLimiter, otpLimiter, complaintLimiter, lostReportLimiter };