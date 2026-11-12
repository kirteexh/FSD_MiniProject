import { Router } from 'express';
import {
  getMedications,
  getMedicationById,
  createMedication,
  updateMedication,
  archiveMedication,
  addBatch,
  adjustStock,
} from '../controllers/inventoryController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getMedications);
router.get('/:id', getMedicationById);
router.post('/', requireAdmin, createMedication);
router.put('/:id', requireAdmin, updateMedication);
router.delete('/:id', requireAdmin, archiveMedication);
router.post('/:id/batches', requireAdmin, addBatch);
router.post('/:id/adjust', adjustStock);

export default router;

