import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

      const user = await prisma.user.upsert({
        where: { wallet: normalizedWallet },
        update: {},
        create: {
          wallet: normalizedWallet,
        },
      });

      res.status(200).json({ success: true, user });
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
