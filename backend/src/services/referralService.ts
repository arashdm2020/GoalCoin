import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const referralService = {
  /**
   * Get monthly referral leaderboard
   * Returns top referrers for the current or specified month
   */
  async getMonthlyLeaderboard(year?: number, month?: number, limit: number = 100) {
    try {
      const now = new Date();
      const targetYear = year || now.getFullYear();
      const targetMonth = month || now.getMonth() + 1;

      // Calculate date range for the month
      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

      // Get referrals for the month grouped by referrer
      const referrals = await prisma.referral.groupBy({
        by: ['referrer_id'],
        where: {
          created_at: {
            gte: startDate,
            lte: endDate,
          },
          status: 'activated', // Only count activated referrals
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: limit,
      });

      // Get user details for each referrer
      const leaderboard = await Promise.all(
        referrals.map(async (ref) => {
          const user = await prisma.user.findUnique({
            where: { id: ref.referrer_id },
            select: {
              id: true,
              handle: true,
              country_code: true,
              xp_points: true,
            },
          });

          return {
            user_id: ref.referrer_id,
            handle: user?.handle || 'Anonymous',
            country_code: user?.country_code,
            xp_points: user?.xp_points || 0,
            referral_count: ref._count.id,
          };
        })
      );

      return {
        year: targetYear,
        month: targetMonth,
        leaderboard,
        total_entries: leaderboard.length,
      };
    } catch (error) {
      console.error('Error getting monthly leaderboard:', error);
      throw error;
    }
  },

  /**
   * Get user's referral stats
   */
  async getUserStats(userId: string) {
    try {
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [totalReferrals, monthlyReferrals, activatedReferrals] = await Promise.all([
        // Total referrals all time
        prisma.referral.count({
          where: { referrer_id: userId },
        }),

        // Referrals this month
        prisma.referral.count({
          where: {
            referrer_id: userId,
            created_at: { gte: currentMonth },
          },
        }),

        // Activated referrals (users who completed first action)
        prisma.referral.count({
          where: {
            referrer_id: userId,
            status: 'activated',
          },
        }),
      ]);

      // Get user's rank in current month
      const leaderboard = await this.getMonthlyLeaderboard(undefined, undefined, 1000);
      const userRank = leaderboard.leaderboard.findIndex(entry => entry.user_id === userId) + 1;

      return {
        total_referrals: totalReferrals,
        monthly_referrals: monthlyReferrals,
        activated_referrals: activatedReferrals,
        conversion_rate: totalReferrals > 0 ? (activatedReferrals / totalReferrals) * 100 : 0,
        current_month_rank: userRank || null,
      };
    } catch (error) {
      console.error('Error getting user referral stats:', error);
      throw error;
    }
  },

  /**
   * Get current month's prize info
   */
  async getCurrentPrize() {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      // Calculate end of month
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);
      const timeRemaining = endOfMonth.getTime() - now.getTime();
      const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

      return {
        year,
        month,
        prize_amount: 100, // $100 USD
        currency: 'USD',
        end_date: endOfMonth,
        days_remaining: daysRemaining,
        status: 'active',
      };
    } catch (error) {
      console.error('Error getting current prize:', error);
      throw error;
    }
  },

  /**
   * Get last month's winner
   */
  async getLastMonthWinner() {
    try {
      const now = new Date();
      const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
      const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

      const leaderboard = await this.getMonthlyLeaderboard(lastMonthYear, lastMonth, 1);

      if (leaderboard.leaderboard.length === 0) {
        return null;
      }

      const winner = leaderboard.leaderboard[0];

      return {
        year: lastMonthYear,
        month: lastMonth,
        winner: {
          user_id: winner.user_id,
          handle: winner.handle,
          country_code: winner.country_code,
          referral_count: winner.referral_count,
        },
        prize_amount: 100,
        currency: 'USD',
      };
    } catch (error) {
      console.error('Error getting last month winner:', error);
      throw error;
    }
  },

  /**
   * Mark winner as paid (admin only)
   */
  async markWinnerPaid(year: number, month: number, userId: string, txHash?: string) {
    try {
      // In a real system, this would update a winners table
      // For now, we'll just log it
      console.log(`Winner marked as paid: ${userId} for ${year}-${month}, tx: ${txHash}`);

      return {
        success: true,
        year,
        month,
        user_id: userId,
        tx_hash: txHash,
        paid_at: new Date(),
      };
    } catch (error) {
      console.error('Error marking winner as paid:', error);
      throw error;
    }
  },

  /**
   * Get referral history for a user
   */
  async getUserReferrals(userId: string, limit: number = 50) {
    try {
      const referrals = await prisma.referral.findMany({
        where: { referrer_id: userId },
        include: {
          referred: {
            select: {
              id: true,
              handle: true,
              country_code: true,
              created_at: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: limit,
      });

      return referrals.map(ref => ({
        id: ref.id,
        referred_user: {
          id: ref.referred.id,
          handle: ref.referred.handle || 'Anonymous',
          country_code: ref.referred.country_code,
        },
        status: ref.status,
        created_at: ref.created_at,
        activated_at: ref.activated_at,
      }));
    } catch (error) {
      console.error('Error getting user referrals:', error);
      throw error;
    }
  },

  /**
   * Get referral stats for admin dashboard
   */
  async getAdminStats() {
    try {
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [totalReferrals, monthlyReferrals, activatedReferrals, topReferrers] = await Promise.all([
        prisma.referral.count(),
        prisma.referral.count({
          where: { created_at: { gte: currentMonth } },
        }),
        prisma.referral.count({
          where: { status: 'activated' },
        }),
        prisma.referral.groupBy({
          by: ['referrer_id'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        }),
      ]);

      const conversionRate = totalReferrals > 0 ? (activatedReferrals / totalReferrals) * 100 : 0;

      return {
        total_referrals: totalReferrals,
        monthly_referrals: monthlyReferrals,
        activated_referrals: activatedReferrals,
        conversion_rate: conversionRate,
        top_referrers_count: topReferrers.length,
      };
    } catch (error) {
      console.error('Error getting admin stats:', error);
      throw error;
    }
  },
};
