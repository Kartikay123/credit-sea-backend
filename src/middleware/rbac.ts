import { Response, NextFunction } from 'express';
import { AuthedRequest, Role } from '../types';

export function requireRole(...allowed: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }
    if (req.user.role === 'admin') return next();
    if (!allowed.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
}
