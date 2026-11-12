import { Request, Response } from 'express';
import { dbStore } from '../services/dbStore.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getSales = async (req: Request, res: Response) => {
  try {
    const { search, status, paymentMode } = req.query;
    const sales = await dbStore.getSales({
      search: search as string,
      status: status as string,
      paymentMode: paymentMode as string,
    });
    res.json({ success: true, count: sales.length, sales });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSaleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sale = await dbStore.getSaleById(id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found.' });
    }
    res.json({ success: true, sale });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const returnSale = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason for return is required.' });
    }

    const sale = await dbStore.returnSale(
      id,
      reason,
      req.user?._id || '66a100000000000000000001'
    );

    res.json({ success: true, message: 'Sale marked as returned and inventory restored.', sale });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

