import { Response } from 'express';
import { dbStore } from '../services/dbStore.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { emitEvent } from '../socket/socketHandler.js';

export const getPurchases = async (req: AuthRequest, res: Response) => {
  try {
    const purchases = await dbStore.getPurchases();
    res.json({ success: true, count: purchases.length, purchases });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPurchase = async (req: AuthRequest, res: Response) => {
  try {
    const { supplierId, items, totalAmount, notes } = req.body;

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Supplier and purchase items are required.' });
    }

    const purchase = await dbStore.createPurchase(
      {
        supplierId,
        items,
        totalAmount: Number(totalAmount),
        notes,
      },
      req.user?._id || '66a100000000000000000001'
    );

    res.status(201).json({ success: true, purchase });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePurchase = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const purchase = await dbStore.updatePurchase(id, req.body);
    res.json({ success: true, message: 'Purchase order updated successfully.', purchase });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const cancelPurchase = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const purchase = await dbStore.cancelPurchase(id);
    res.json({ success: true, message: 'Purchase order cancelled successfully.', purchase });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const receivePurchaseStock = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const purchase = await dbStore.receivePurchaseStock(id, req.user?._id || '66a100000000000000000001');

    // Notify clients that new stock has arrived
    emitEvent('purchase_received', {
      purchaseNo: purchase.purchaseNo,
      supplierId: purchase.supplierId,
      timestamp: new Date(),
    });

    res.json({ success: true, message: 'Stock received and inventory batches created.', purchase });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
