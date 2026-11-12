import { Router } from 'express';
import { getSales, getSaleById, returnSale } from '../controllers/salesController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getSales);
router.get('/:id', getSaleById);
router.post('/:id/return', requireAdmin, returnSale);

export default router;

