const admin = require('firebase-admin');

let initialized = false;

const initFirebaseAdmin = () => {
  if (initialized || admin.apps.length) {
    initialized = true;
    return admin;
  }

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
      });
    } else {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'fashion-mate-mawanella',
      });
    }
    initialized = true;
    console.log('🔥 Firebase Admin initialized');
  } catch (error) {
    console.warn('Firebase Admin init warning:', error.message);
  }

  return admin;
};

const verifyFirebaseToken = async (idToken) => {
  initFirebaseAdmin();

  if (!admin.apps.length) {
    throw new Error('Firebase Admin not configured. Add FIREBASE_SERVICE_ACCOUNT_JSON to backend .env');
  }

  return admin.auth().verifyIdToken(idToken);
};

module.exports = { initFirebaseAdmin, verifyFirebaseToken, admin };
