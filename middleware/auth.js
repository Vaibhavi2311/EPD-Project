/**
 * middleware/auth.js
 * JWT authentication & role-based authorization middleware.
 */

const jwt = require('jsonwebtoken');

/**
 * Verifies JWT token from Authorization header.
 * Attaches decoded user payload to req.user.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided. Please log in.' });
  }
  const token  = header.split(' ')[1];
  const secret = req.app.get('JWT_SECRET');
  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

/**
 * Middleware factory: restricts access to specified roles.
 * Usage: authorize('admin') or authorize('admin','student')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
