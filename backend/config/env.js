const required = [
  'FIREBASE_API_KEY',
  'JWT_SECRET',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
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
  jwtSecret: process.env.JWT_SECRET,
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASSWORD,
  hodEmail: process.env.HOD_EMAIL,
  cronSecret: process.env.CRON_SECRET,
  firebaseApiKey: process.env.FIREBASE_API_KEY,
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
};