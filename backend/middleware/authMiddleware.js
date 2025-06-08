const jwt = require('jsonwebtoken');
const JWT_SECRET = 'owied_platform_secret_key';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'مطلوب توثيق' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.status(403).json({ message: 'توكن غير صالح أو منتهي الصلاحية' });
    }
    
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    next();
  });
};

module.exports = authenticateToken;