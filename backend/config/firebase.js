const admin = require('firebase-admin');

let serviceAccount;


if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  

  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }
} else {

  try {
    serviceAccount = require('../serviceAccountKey.json');
  } catch {
    console.error('serviceAccountKey.json not found and FIREBASE_SERVICE_ACCOUNT env not set. Exiting.');
    process.exit(1);
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

module.exports = admin;