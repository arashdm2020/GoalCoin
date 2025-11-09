import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const analyticsService = {
  /**
   * Track an event
   */
  async trackEvent(params: {
    eventName: string;
    userId?: string;
    properties?: Record<string, any>;
    countryCode?: string;
  }) {
    try {
      // For now, just log to console
      // In production, this would write to analytics_events table
      console.log('Analytics Event:', {
        event: params.eventName,
        user: params.userId,
        country: params.countryCode,
        props: params.properties,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  },

  /**
   * Get platform metrics
   */
  async getPlatformMetrics(days: number = 7) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      // Get DAU (users active in last 24h)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const dau = await prisma.user.count({
        where: {
          last_activity_date: { gte: oneDayAgo },
        },
      });

      // Get MAU (users active in last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const mau = await prisma.user.count({
        where: {
          last_activity_date: { gte: thirtyDaysAgo },
        },
      });

      // Get total users
      const totalUsers = await prisma.user.count();

      // Get paid users
      const paidUsers = await prisma.user.count({
        where: { paid: true },
      });

      return {
        dau,
        mau,
        total_users: totalUsers,
        paid_users: paidUsers,
        conversion_rate: totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0,
      };
    } catch (error) {
      console.error('Error getting platform metrics:', error);
      throw error;
    }
  },
};
