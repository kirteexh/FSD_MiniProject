import { Router } from 'express';
import { login, getMe, forgotPassword } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.post('/forgot-password', forgotPassword);

export default router;

