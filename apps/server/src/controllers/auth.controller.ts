import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../domains/auth/services/auth.service';

export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.authService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.authService.login(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   * GET /api/auth/me
   */
  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      // User is already attached to request by auth middleware
      res.json({ success: true, data: req.user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user (client-side token removal)
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // JWT is stateless, so logout is handled client-side
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }
}
