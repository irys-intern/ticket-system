import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/index';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: UserRole;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }
  next();
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    next();
  };
};
