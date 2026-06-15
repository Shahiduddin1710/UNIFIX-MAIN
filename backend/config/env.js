const required = [
  'FIREBASE_API_KEY',
  'BREVO_API_KEY',
  'BREVO_SENDER_EMAIL',
  'HOD_EMAIL',
  'CRON_SECRET',
  'REDIS_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_UPLOAD_PRESET',
];

required.forEach((key) => {
  if (!process.env[key]) {
    console.error(`[ENV] Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  redisUrl: process.env.REDIS_URL,
  brevoApiKey: process.env.BREVO_API_KEY,
  brevoSenderEmail: process.env.BREVO_SENDER_EMAIL,
  hodEmail: process.env.HOD_EMAIL,
  cronSecret: process.env.CRON_SECRET,
  firebaseApiKey: process.env.FIREBASE_API_KEY,
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
};