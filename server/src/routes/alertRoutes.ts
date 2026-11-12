import { Router } from 'express';
import { getAlerts, markRead, markAllRead } from '../controllers/alertController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAlerts);
router.put('/:id/read', markRead);
router.put('/mark-all/read', markAllRead);

export default router;

