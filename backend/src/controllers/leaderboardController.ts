import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const prismaAny = prisma as any;

export const leaderboardController = {
  async countries(req: Request, res: Response) {
    try {
      const grouped = await prismaAny.user.groupBy({
        by: ['country'],
        where: { country: { not: null } },
        _count: { _all: true },
      });
      const result = grouped
        .filter((g: any) => (g as any).country)
        .map((g: any) => ({ country: (g as any).country as string, users: (g._count as any)._all as number }))
        .sort((a: { users: number }, b: { users: number }) => b.users - a.users);
      res.status(200).json({ success: true, countries: result });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async users(req: Request, res: Response) {
    try {
      const { country } = req.query as { country?: string };
      const users = await prismaAny.user.findMany({
        where: country ? { country } : undefined,
        orderBy: { lastSeen: 'desc' },
        select: { address: true, country: true, lastSeen: true },
        take: 200,
      });
      res.status(200).json({ success: true, users });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
