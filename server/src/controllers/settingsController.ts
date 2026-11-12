import { Request, Response } from 'express';
import { dbStore } from '../services/dbStore.js';

export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await dbStore.getSettings();
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const settings = await dbStore.updateSettings(req.body);
    res.json({ success: true, settings, message: 'Settings updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

