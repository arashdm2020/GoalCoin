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

      if (!address || typeof address !== 'string') {
        res.status(400).json({ error: 'Address is required' });
        return;
      }

      if (!isValidAddress(address)) {
        res.status(400).json({ error: 'Invalid Ethereum address format' });
        return;
      }

      // Normalize address to lowercase for consistency
      const normalizedAddress = address.toLowerCase();

      // Upsert user with connection timestamp
      const user = await prisma.user.upsert({
        where: { address: normalizedAddress },
        update: { connectedAt: new Date() },
        create: {
          address: normalizedAddress,
          connectedAt: new Date(),
        },
      });

      res.status(200).json({
        success: true,
        user: {
          address: user.address,
          connectedAt: user.connectedAt,
        },
      });
    } catch (error) {
      console.error('Error in user connect:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
