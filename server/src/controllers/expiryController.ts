import { Request, Response } from 'express';
import { dbStore } from '../services/dbStore.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getExpiry = async (req: Request, res: Response) => {
  try {
    const { range } = req.query; // '7', '30', '90', 'expired', or 'all'
    const batches = await dbStore.getExpiryData((range as string) || 'all');
    res.json({ success: true, count: batches.length, batches });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const disposeBatch = async (req: AuthRequest, res: Response) => {
  try {
    const { batchId } = req.params;
    const { reason } = req.body;

    const batch = await dbStore.disposeBatch(
      batchId,
      reason || 'Expired batch written off and removed',
      req.user?._id || '66a100000000000000000001'
    );

    res.json({ success: true, message: 'Expired batch written off and removed from active inventory.', batch });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

