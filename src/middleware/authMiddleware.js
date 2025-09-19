// middleware/authMiddleware.js
require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('⚠️ JWT_SECRET is not set. Set it in .env and restart the server.');
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log('🔑 Incoming Auth Header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  console.log('📦 Extracted Token:', token);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ JWT verified, decoded payload:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('❌ JWT verification failed:', err.message);
    return res.status(403).json({ message: 'invalid token' });
  }
}

module.exports = authMiddleware;
