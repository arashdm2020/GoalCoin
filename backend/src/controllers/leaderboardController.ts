import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const leaderboardController = {
  async getCountries(req: Request, res: Response): Promise<void> {
    try {
      const countries = await prisma.user.groupBy({
        by: ['country_code'],
        where: { country_code: { not: null } },
        _count: { _all: true },
      });

      const result = countries
        .filter(c => c.country_code)
        .map(c => ({
          country_code: c.country_code,
          user_count: c._count._all,
        }))
        .sort((a, b) => b.user_count - a.user_count);

      res.status(200).json({ success: true, countries: result });
    } catch (error) {
      console.error('Failed to fetch countries:', error);
      res.status(500).json({ error: 'Failed to fetch countries' });
    }
  },

  async getUsersByCountry(req: Request, res: Response): Promise<void> {
    const { country_code } = req.query;

    try {
      const users = await prisma.user.findMany({
        where: country_code ? { country_code: country_code as string } : {},
        select: {
          wallet: true,
          handle: true,
          country_code: true,
          tier: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
        take: 100,
      });

      res.status(200).json({ success: true, users });
    } catch (error) {
      console.error('Failed to fetch users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  },
};
