import { Router } from 'express';
import {
  getPurchases,
  createPurchase,
  updatePurchase,
  cancelPurchase,
  receivePurchaseStock,
} from '../controllers/purchaseController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getPurchases);
router.post('/', requireAdmin, createPurchase);
router.put('/:id', requireAdmin, updatePurchase);
router.delete('/:id', requireAdmin, cancelPurchase);
router.post('/:id/receive', requireAdmin, receivePurchaseStock);

export default router;
