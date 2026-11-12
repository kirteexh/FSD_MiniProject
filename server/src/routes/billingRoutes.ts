import { Router } from 'express';
import { checkout } from '../controllers/billingController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.post('/checkout', checkout);

export default router;

