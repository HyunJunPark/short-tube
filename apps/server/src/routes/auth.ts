import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authService } from '../repositories';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { authenticate } from '../middleware/auth';

const router = Router();
const authController = new AuthController(authService);

// Public routes
router.post('/register', validate(registerSchema), authController.register.bind(authController));
router.post('/login', validate(loginSchema), authController.login.bind(authController));

// Protected routes
router.get('/me', authenticate(authService), authController.getCurrentUser.bind(authController));
router.post('/logout', authenticate(authService), authController.logout.bind(authController));

export default router;
