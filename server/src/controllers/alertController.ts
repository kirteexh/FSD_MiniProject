import { Request, Response } from 'express';
import { dbStore } from '../services/dbStore.js';

export const getAlerts = async (req: Request, res: Response) => {
  try {
    const alerts = await dbStore.getAlerts();
    res.json({ success: true, count: alerts.length, alerts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const alert = await dbStore.markAlertRead(id);
    res.json({ success: true, alert });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllRead = async (req: Request, res: Response) => {
  try {
    await dbStore.markAllAlertsRead();
    res.json({ success: true, message: 'All alerts marked as read.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

