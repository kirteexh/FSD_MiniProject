import { Router } from 'express';
import { getExpiry, disposeBatch } from '../controllers/expiryController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getExpiry);
router.post('/:batchId/dispose', requireAdmin, disposeBatch);

export default router;

