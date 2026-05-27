const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'news-portal-secret-key-change-in-production';

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access denied. No authentication token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired authentication token.' });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    req.user = null; // silently ignore token failures for optional routes
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Access denied. Administrator privileges required.' });
  }

  next();
}

module.exports = {
  authenticate,
  optionalAuth,
  requireAdmin,
};
