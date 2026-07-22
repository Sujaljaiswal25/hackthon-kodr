const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');

/**
 * Resolve JWT secret using multi-tiered fallback:
 * 1. Environment variable
 * 2. Local file
 * 3. Ephemeral random generation (dev only, logs warning)
 */
function getJwtSecret() {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET !== 'CHANGE_ME_TO_A_STRONG_RANDOM_SECRET') {
    return process.env.JWT_SECRET;
  }
  const secretPath = './jwt_secret.txt';
  if (fs.existsSync(secretPath)) {
    return fs.readFileSync(secretPath, 'utf-8').trim();
  }
  console.warn(
    'WARNING: Generating ephemeral JWT secret. This is instance-isolated and not suitable for production!'
  );
  return crypto.randomBytes(32).toString('hex');
}

const JWT_SECRET = getJwtSecret();

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    // Hardcode algorithm to HS256, reject 'none' algorithm
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '24h',
  });
};

module.exports = { auth, generateToken, JWT_SECRET };
