import { Router } from 'express';
import { getReports } from '../controllers/reportsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', getReports);

export default router;

