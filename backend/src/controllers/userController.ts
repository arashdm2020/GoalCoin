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
      const { address } = req.body;

      if (!address || typeof address !== 'string' || !isValidAddress(address)) {
        res.status(400).json({ error: 'Valid address is required' });
        return;
      }

      const normalizedAddress = address.toLowerCase();

      const user = await prisma.user.upsert({
        where: { address: normalizedAddress },
        update: { isConnected: true, lastSeen: new Date() },
        create: {
          address: normalizedAddress,
          isConnected: true,
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
      const { address } = req.body;

      if (!address || typeof address !== 'string' || !isValidAddress(address)) {
        res.status(400).json({ error: 'Valid address is required' });
        return;
      }

      const normalizedAddress = address.toLowerCase();

      await prisma.user.update({
        where: { address: normalizedAddress },
        data: { isConnected: false },
      });

      res.status(200).json({ success: true, message: 'User disconnected' });
    } catch (error) {
      // Ignore errors if user not found, as the goal is to disconnect
      if ((error as any).code === 'P2025') {
        res.status(200).json({ success: true, message: 'User not found, considered disconnected' });
        return;
      }
      console.error('Error in user disconnect:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
