const jwt = require('jsonwebtoken');
const JWT_SECRET = ' vfture7$#$#%^TY&*^%$%#GVGYT%^'; // Use environment variables in production

const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Failed to authenticate token' });
    }
    req.userId = decoded.userId;
    next();
  });
};

module.exports = authMiddleware;