const { Redis } = require('ioredis');

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => Math.min(times * 500, 5000),
});

redis.on('connect', () => console.log('[Redis] Connected'));
redis.on('error', (err) => {
  if (err.code !== 'ECONNRESET' && err.code !== 'ENOTFOUND') {
    console.error('[Redis] Error:', err.message);
  }
}); 

module.exports = redis;