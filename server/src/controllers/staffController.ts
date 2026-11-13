import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { dbStore } from '../services/dbStore.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getStaff = async (req: Request, res: Response) => {
  try {
    const users = await dbStore.getUsers();
    res.json({ success: true, count: users.length, users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createStaff = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existing = await dbStore.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await dbStore.createUser({
      name,
      email,
      passwordHash,
      role: role || 'cashier',
    });

    const userObj = user && typeof (user as any).toObject === 'function' ? (user as any).toObject() : user;
    const { passwordHash: _, ...safeUser } = userObj;
    res.status(201).json({ success: true, user: safeUser });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStaff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, isActive } = req.body;

    const updated = await dbStore.updateUser(id, { name, role, isActive });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const updatedObj = updated && typeof (updated as any).toObject === 'function' ? (updated as any).toObject() : updated;
    const { passwordHash: _, ...safeUser } = updatedObj;
    res.json({ success: true, user: safeUser });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteStaff = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (req.user?._id === id) {
      return res.status(400).json({ success: false, message: 'Administrators cannot delete their own account.' });
    }

    const deleted = await dbStore.deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, message: 'Staff account removed successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetStaffPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await dbStore.updateUser(id, { passwordHash });

    res.json({ success: true, message: 'Staff password reset successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
