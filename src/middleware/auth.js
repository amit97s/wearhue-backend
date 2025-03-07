import jwt  from 'jsonwebtoken'
import UserModel from '../models/users.js';

const authMiddleware = {
  protect: async (req, res, next) => {
    try {
      let token;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }

      if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await UserModel.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  },

  admin: async (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(401).json({ message: 'Not authorized as admin' });
    }
  }
};

export default authMiddleware;