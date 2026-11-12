import { Request, Response } from 'express';
import { dbStore } from '../services/dbStore.js';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const stats = await dbStore.getDashboardStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

