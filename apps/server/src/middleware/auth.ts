import { Request, Response, NextFunction } from 'express';
import { UserWithoutPassword } from '@short-tube/types';
import { AppError } from '../utils/errors';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: UserWithoutPassword;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export function authenticate(authService: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError(401, 'No token provided');
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify token
      const { userId } = authService.verifyToken(token);

      // Get user from database
      const user = await authService.getUserById(userId);
      if (!user) {
        throw new AppError(401, 'User not found');
      }

      // Attach user to request
      req.user = user;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Optional authentication middleware
 * Attaches user to request if token is provided, but doesn't fail if not
 */
export function optionalAuthenticate(authService: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { userId } = authService.verifyToken(token);
        const user = await authService.getUserById(userId);
        if (user) {
          req.user = user;
        }
      }
      next();
    } catch (error) {
      // Ignore authentication errors in optional mode
      next();
    }
  };
}
