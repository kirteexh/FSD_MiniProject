import { Router } from 'express';
import {
  getStaff,
  createStaff,
  updateStaff,
  resetStaffPassword,
} from '../controllers/staffController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', getStaff);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.post('/:id/reset-password', resetStaffPassword);

export default router;

