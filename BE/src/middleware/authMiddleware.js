import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = await Admin.findById(decoded.id).select('-password');
      if (!req.admin || !req.admin.isActive || !req.admin.isApproved) {
        return res.status(401).json({ message: 'Account is not active' });
      }
      req.user = req.admin;
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const optionalProtect = async (req, res, next) => {
  if (!req.headers.authorization?.startsWith('Bearer ')) return next();
  return protect(req, res, next);
};

export const requirePlatformAdmin = (req, res, next) => {
  if (req.user?.role !== 'platform_admin') {
    return res.status(403).json({ message: 'Platform administrator access required' });
  }
  next();
};
