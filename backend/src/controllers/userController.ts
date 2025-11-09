import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Validates Ethereum address format (basic validation)
 */
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * POST /api/users/connect
 * Upserts user connection timestamp
 */
export const userController = {
  async connect(req: Request, res: Response): Promise<void> {
    try {
      const { wallet } = req.body;

      if (!wallet || typeof wallet !== 'string' || !isValidAddress(wallet)) {
        res.status(400).json({ error: 'Valid wallet address is required' });
        return;
      }

      const normalizedWallet = wallet.toLowerCase();

      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { wallet: normalizedWallet },
      });

      let isNewUser = false;

      if (user) {
        // User exists - update last activity
        user = await prisma.user.update({
          where: { wallet: normalizedWallet },
          data: {
            last_activity_date: new Date(),
          },
        });
      } else {
        // New user - create account
        isNewUser = true;
        user = await prisma.user.create({
          data: {
            wallet: normalizedWallet,
            xp_points: 0,
            goal_points: 0,
            current_streak: 0,
            longest_streak: 0,
            burn_multiplier: 1.0,
            is_holder: false,
            micro_goal_points: 0,
            last_activity_date: new Date(),
          },
        });
      }

      // Generate JWT token for authentication
      const token = jwt.sign(
        { userId: user.id, wallet: user.wallet },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(200).json({ 
        success: true, 
        user,
        token,
        isNewUser,
        message: isNewUser ? 'Account created successfully' : 'Welcome back!'
      });
    } catch (error) {
      console.error('Error in user connect:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async disconnect(req: Request, res: Response): Promise<void> {
    try {
      const { wallet } = req.body;

      if (!wallet || typeof wallet !== 'string' || !isValidAddress(wallet)) {
        res.status(400).json({ error: 'Valid wallet address is required' });
        return;
      }

      // In the new schema, we don't track online status, so this is just a no-op
      res.status(200).json({ success: true, message: 'User disconnected' });
    } catch (error) {
      console.error('Error in user disconnect:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async heartbeat(req: Request, res: Response): Promise<void> {
    try {
      const { wallet } = req.body;

      if (!wallet || typeof wallet !== 'string' || !isValidAddress(wallet)) {
        res.status(400).json({ error: 'Valid wallet address is required' });
        return;
      }

      // In the new schema, we don't track heartbeats, so this is just a no-op
      res.status(200).json({ success: true, message: 'Heartbeat received' });
    } catch (error) {
      console.error('Error in heartbeat:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
