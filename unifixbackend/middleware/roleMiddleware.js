const admin = require('../config/firebase');

const verifyAdminToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const userDoc = await admin.firestore().collection('users').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.admin = { uid: decoded.uid, ...userDoc.data() };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
};

module.exports = { verifyAdminToken, allowRoles };