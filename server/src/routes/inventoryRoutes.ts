import { Router } from 'express';
import {
  getMedications,
  getMedicationById,
  getMedicationByBarcode,
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
// Route order matters: specific routes before parameter routes
router.get('/barcode/:code', getMedicationByBarcode);
router.get('/:id', getMedicationById);
router.post('/', requireAdmin, createMedication);
router.put('/:id', requireAdmin, updateMedication);
router.delete('/:id', requireAdmin, archiveMedication);
router.post('/:id/batches', requireAdmin, addBatch);
// Strict security: adjustStock requires administrative permissions
router.post('/:id/adjust', requireAdmin, adjustStock);

export default router;
