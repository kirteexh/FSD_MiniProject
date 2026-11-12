import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware.js';

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Administrative privileges required.',
    });
  }
  next();
};

export const requireRoles = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Requires one of: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

