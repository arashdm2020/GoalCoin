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

  async getLeaderboard(req: Request, res: Response): Promise<void> {
    const { scope = 'global', country } = req.query as { scope?: string; country?: string };

    try {
      let whereClause = {};
      
      if (scope === 'country' && country) {
        whereClause = { country_code: country };
      }

      // Get users with their submission counts and success rates
      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          wallet: true,
          handle: true,
          country_code: true,
          tier: true,
          created_at: true,
          submissions: {
            select: {
              status: true,
            },
          },
        },
        take: 100,
      });

      // Calculate leaderboard metrics
      const leaderboard = users.map(user => {
        const totalSubmissions = user.submissions.length;
        const approvedSubmissions = user.submissions.filter(s => s.status === 'APPROVED').length;
        const successRate = totalSubmissions > 0 ? (approvedSubmissions / totalSubmissions) * 100 : 0;

        return {
          wallet: user.wallet,
          handle: user.handle,
          country_code: user.country_code,
          tier: user.tier,
          total_submissions: totalSubmissions,
          approved_submissions: approvedSubmissions,
          success_rate: Math.round(successRate * 100) / 100,
          joined_at: user.created_at,
        };
      }).sort((a, b) => {
        // Sort by approved submissions first, then by success rate
        if (a.approved_submissions !== b.approved_submissions) {
          return b.approved_submissions - a.approved_submissions;
        }
        return b.success_rate - a.success_rate;
      });

      res.status(200).json({ 
        success: true, 
        scope,
        country: scope === 'country' ? country : null,
        leaderboard 
      });
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  },
};
