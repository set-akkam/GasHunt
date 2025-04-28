import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('Token verification error:', err.message);
        return res.status(403).json({ 
          message: 'Invalid or expired token',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }

      // Set user data from decoded token
      req.user = {
        id: decoded.id,
        _id: decoded._id,
        email: decoded.email,
        name: decoded.name
      };
      
      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};
