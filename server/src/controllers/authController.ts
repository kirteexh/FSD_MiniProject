import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbStore } from '../services/dbStore.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await dbStore.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Update lastLogin
    await dbStore.updateUser(user._id.toString(), { lastLogin: new Date() });

    const secret = process.env.JWT_SECRET || 'pharmacare_super_secure_jwt_secret_key_2026_x!98';
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role, name: user.name },
      secret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const user = await dbStore.findUserById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await dbStore.findUserByEmail(email);
  if (!user) {
    // Return friendly generic message for security
    return res.json({
      success: true,
      message: 'If an account exists with this email, password reset instructions have been sent.',
    });
  }
  res.json({
    success: true,
    message: 'Password reset link sent to registered email address (Demo simulation: Use admin credentials or reset directly).',
  });
};

