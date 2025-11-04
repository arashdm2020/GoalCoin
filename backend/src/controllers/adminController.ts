import { Request, Response } from 'express';
import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/admin/users
 * Returns all users ordered by latest connection timestamp
 */
export const adminController = {
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
                  const allUsers = await prisma.user.findMany({
        orderBy: {
          lastSeen: 'desc',
        },
      });

      // Define thresholds based on environment
      const isDemo = process.env.NODE_ENV !== 'production';
      const thresholds = {
        active: isDemo ? 5 * 60 * 1000 : 24 * 60 * 60 * 1000, // 5 mins in demo, 24h in prod
        dormant: isDemo ? 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000, // 60 mins in demo, 7d in prod
      };

      const now = Date.now();

      const usersWithStatus = allUsers.map(user => {
        const timeDiff = now - new Date(user.lastSeen).getTime();
        let status: 'Active' | 'Dormant' | 'Inactive';

        if (user.online || timeDiff < thresholds.active) {
          status = 'Active';
        } else if (timeDiff < thresholds.dormant) {
          status = 'Dormant';
        } else {
          status = 'Inactive';
        }

        return { ...user, status };
      });

      res.status(200).json({
        success: true,
        count: usersWithStatus.length,
        users: usersWithStatus,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
