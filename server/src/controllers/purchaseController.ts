import { Request, Response } from 'express';
import { dbStore } from '../services/dbStore.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { emitEvent } from '../socket/socketHandler.js';

export const getPurchases = async (req: Request, res: Response) => {
  try {
    const purchases = await dbStore.getPurchases();
    res.json({ success: true, count: purchases.length, purchases });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPurchase = async (req: AuthRequest, res: Response) => {
  try {
    const { supplierId, items, notes } = req.body;

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Supplier and items are required.' });
    }

    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.subtotal || item.quantity * item.purchasePrice), 0);

    const purchase = await dbStore.createPurchase(
      {
        supplierId,
        items,
        totalAmount,
        notes,
      },
      req.user?._id || '66a100000000000000000001'
    );

    res.status(201).json({ success: true, purchase });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const receivePurchaseStock = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const purchase = await dbStore.receivePurchaseStock(id, req.user?._id || '66a100000000000000000001');

    emitEvent('purchase_received', {
      purchaseNo: purchase.purchaseNo,
      totalAmount: purchase.totalAmount,
      receivedAt: purchase.receivedAt,
    });

    res.json({ success: true, message: 'Stock received and batches added to inventory.', purchase });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

