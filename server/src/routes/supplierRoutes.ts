import { Router } from 'express';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplierController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getSuppliers);
router.get('/:id', getSupplierById);
router.post('/', requireAdmin, createSupplier);
router.put('/:id', requireAdmin, updateSupplier);
router.delete('/:id', requireAdmin, deleteSupplier);

export default router;
