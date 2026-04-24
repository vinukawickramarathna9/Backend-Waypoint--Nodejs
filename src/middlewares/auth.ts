import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

interface JwtPayload {
  id: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: any;
}

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ success: false, error: { message: 'Not authorized to access this route' } });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: 'User not found' } });
      return;
    }
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: { message: 'Not authorized to access this route' } });
  }
};

export const isDriver = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && (req.user.role === 'driver' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ success: false, error: { message: 'User role is not authorized' } });
  }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, error: { message: 'User role is not authorized' } });
  }
};
