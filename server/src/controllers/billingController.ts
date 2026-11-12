import { Response } from 'express';
import { dbStore } from '../services/dbStore.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { emitEvent } from '../socket/socketHandler.js';

export const checkout = async (req: AuthRequest, res: Response) => {
  try {
    const { customerName, customerPhone, items, discount, paymentMode, notes, prescription } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items cannot be empty.' });
    }

    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'Authenticated user session required for billing.' });
    }

    const cashierId = req.user._id;

    const result = await dbStore.processCheckout({
      cashierId,
      customerName,
      customerPhone,
      items,
      discount: Number(discount) || 0,
      paymentMode: paymentMode || 'Cash',
      notes,
      prescription,
    });

    // Emit live sales event
    emitEvent('sale_completed', {
      invoiceNo: result.sale.invoiceNo,
      totalAmount: result.sale.totalAmount,
      cashierName: req.user.name,
      timestamp: result.sale.createdAt,
    });

    // Emit live low-stock alerts if triggered
    if (result.alerts && result.alerts.length > 0) {
      result.alerts.forEach((alert) => {
        emitEvent('stock_alert', alert);
      });
    }

    res.status(201).json({
      success: true,
      message: 'Sale completed successfully.',
      sale: result.sale,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
