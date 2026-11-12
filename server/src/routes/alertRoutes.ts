import { Router } from 'express';
import { getAlerts, markRead, markAllRead } from '../controllers/alertController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAlerts);
// IMPORTANT: Put specific subpath `/mark-all/read` before parameter `:id/read` so Express does not match `:id = 'mark-all'`
router.put('/mark-all/read', markAllRead);
router.put('/:id/read', markRead);

export default router;
