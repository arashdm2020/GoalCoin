import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const scoreboardWidgetService = {
  /**
   * Get World Index (Top 10 countries with trends)
   */
  async getWorldIndex() {
    try {
      const topCountries = await prisma.$queryRaw<any[]>`
        SELECT 
          country_code,
          COUNT(DISTINCT id) as active_users,
          SUM(xp_points) as total_xp,
          AVG(current_streak) as avg_streak
        FROM users
        WHERE country_code IS NOT NULL
        GROUP BY country_code
        ORDER BY total_xp DESC
        LIMIT 10
      `;

      return {
        top_countries: topCountries.map((country, index) => ({
          rank: index + 1,
          country_code: country.country_code,
          active_users: parseInt(country.active_users),
          total_xp: parseInt(country.total_xp),
          avg_streak: parseFloat(country.avg_streak).toFixed(1),
        })),
        updated_at: new Date(),
      };
    } catch (error) {
      console.error('Error getting world index:', error);
      throw error;
    }
  },

  /**
   * Get user's personal impact widget
   */
  async getUserImpact(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          country_code: true,
          xp_points: true,
          current_streak: true,
        },
      });

      if (!user || !user.country_code) {
        return null;
      }

      // Get today's XP earned
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayXP = await prisma.xpEvent.aggregate({
        where: {
          user_id: userId,
          created_at: { gte: today },
        },
        _sum: { xp_awarded: true },
      });

      // Get country total XP
      const countryStats = await prisma.user.aggregate({
        where: { country_code: user.country_code },
        _sum: { xp_points: true },
      });

      const userContribution = countryStats._sum.xp_points 
        ? (user.xp_points / countryStats._sum.xp_points) * 100 
        : 0;

      return {
        country_code: user.country_code,
        today_xp: todayXP._sum.xp_awarded || 0,
        total_xp: user.xp_points,
        current_streak: user.current_streak,
        country_contribution: userContribution.toFixed(2),
      };
    } catch (error) {
      console.error('Error getting user impact:', error);
      throw error;
    }
  },

  /**
   * Get upcoming burns board
   */
  async getUpcomingBurns() {
    try {
      // For now, return mock data
      // In production, this would query burn_events table
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15);

      return {
        upcoming_burns: [
          {
            id: 'burn-monthly',
            type: 'monthly',
            title: 'Monthly Treasury Burn',
            scheduled_date: nextMonth,
            estimated_amount: 0, // Will be calculated
            status: 'scheduled',
          },
        ],
        total_burned_to_date: 0, // Will be calculated from burn history
      };
    } catch (error) {
      console.error('Error getting upcoming burns:', error);
      throw error;
    }
  },

  /**
   * Get season widget info
   */
  async getCurrentSeason() {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Determine season pool based on quarter
      const quarter = Math.ceil(currentMonth / 3);
      const pools = ['WILD', 'AFR', 'AMER', 'EUAS'];
      const currentPool = pools[quarter - 1];

      // Calculate end of quarter
      const endMonth = quarter * 3;
      const endDate = new Date(currentYear, endMonth, 0, 23, 59, 59);
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        season: `Q${quarter} ${currentYear}`,
        pool: currentPool,
        start_date: new Date(currentYear, (quarter - 1) * 3, 1),
        end_date: endDate,
        days_remaining: daysRemaining,
        status: 'active',
      };
    } catch (error) {
      console.error('Error getting current season:', error);
      throw error;
    }
  },

  /**
   * Get streak and burn visibility
   */
  async getStreakBurnStats(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          current_streak: true,
          longest_streak: true,
          xp_points: true,
        },
      });

      if (!user) {
        return null;
      }

      // Calculate estimated burn contribution (simplified)
      // In production, this would use actual burn calculations
      const estimatedBurnContribution = Math.floor(user.xp_points / 1000);

      return {
        current_streak: user.current_streak,
        longest_streak: user.longest_streak,
        estimated_burn_contribution: estimatedBurnContribution,
        message: `Your ${user.current_streak}-day streak helped burn ${estimatedBurnContribution} GC this week!`,
      };
    } catch (error) {
      console.error('Error getting streak burn stats:', error);
      throw error;
    }
  },

  /**
   * Get all scoreboard widgets for a user
   */
  async getAllWidgets(userId: string) {
    try {
      const [worldIndex, userImpact, upcomingBurns, currentSeason, streakBurnStats] = await Promise.all([
        this.getWorldIndex(),
        this.getUserImpact(userId),
        this.getUpcomingBurns(),
        this.getCurrentSeason(),
        this.getStreakBurnStats(userId),
      ]);

      return {
        world_index: worldIndex,
        user_impact: userImpact,
        upcoming_burns: upcomingBurns,
        current_season: currentSeason,
        streak_burn_stats: streakBurnStats,
      };
    } catch (error) {
      console.error('Error getting all widgets:', error);
      throw error;
    }
  },
};
