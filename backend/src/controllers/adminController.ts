import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/admin/users
 * Returns all users ordered by latest connection timestamp
 */
export const adminController = {
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        orderBy: {
          connectedAt: 'desc',
        },
        select: {
          address: true,
          connectedAt: true,
        },
      });

      res.status(200).json({
        success: true,
        count: users.length,
        users,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
