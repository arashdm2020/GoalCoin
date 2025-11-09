import { PrismaClient } from '@prisma/client';
import { WARMUP_MOVES, WARMUP_ROUTINES, generateDailyWarmup, getTodaysWarmup, WarmupRoutine } from '../data/warmupCatalog';

const prisma = new PrismaClient();

export const warmupService = {
  /**
   * Get all available warm-up moves
   */
  async getAllMoves() {
    return WARMUP_MOVES;
  },

  /**
   * Get all pre-defined routines
   */
  async getAllRoutines() {
    return Object.values(WARMUP_ROUTINES);
  },

  /**
   * Get today's recommended warm-up for a user
   */
  async getTodaysRoutine(userId: string) {
    try {
      // Get user's current level (based on XP or tier)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { xp_points: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Determine level based on XP
      let level: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
      if (user.xp_points >= 5000) {
        level = 'advanced';
      } else if (user.xp_points >= 1000) {
        level = 'intermediate';
      }

      return getTodaysWarmup(userId, level);
    } catch (error) {
      console.error('Error getting today\'s warmup:', error);
      throw error;
    }
  },

  /**
   * Log warm-up completion and award XP
   */
  async completeWarmup(userId: string, routineId: string) {
    try {
      // Check if already completed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingLog = await prisma.warmupLog.findFirst({
        where: {
          user_id: userId,
          completed_at: {
            gte: today,
          },
        },
      });

      if (existingLog) {
        return {
          success: false,
          message: 'Warm-up already completed today',
          xp_awarded: 0,
        };
      }

      // Find routine to get XP reward
      const routine = Object.values(WARMUP_ROUTINES).find(r => r.id === routineId);
      const xpReward = routine?.xp_reward || 5;

      // Create warm-up log
      const warmupLog = await prisma.warmupLog.create({
        data: {
          user_id: userId,
          routine_id: routineId,
          duration_seconds: routine?.total_duration || 300,
          xp_earned: xpReward,
          completed_at: new Date(),
        },
      });

      // Award XP via XP service
      const xpService = require('./xpService').xpService;
      await xpService.awardXP({
        userId,
        actionKey: 'warmup',
        metadata: {
          routine_id: routineId,
          warmup_log_id: warmupLog.id,
        },
      });

      // Update user's last activity
      await prisma.user.update({
        where: { id: userId },
        data: { last_activity_date: new Date() },
      });

      return {
        success: true,
        message: 'Warm-up completed successfully!',
        xp_awarded: xpReward,
        log: warmupLog,
      };
    } catch (error) {
      console.error('Error completing warmup:', error);
      throw error;
    }
  },

  /**
   * Get user's warm-up history
   */
  async getUserHistory(userId: string, limit: number = 30) {
    try {
      const logs = await prisma.warmupLog.findMany({
        where: { user_id: userId },
        orderBy: { completed_at: 'desc' },
        take: limit,
      });

      return logs;
    } catch (error) {
      console.error('Error getting warmup history:', error);
      throw error;
    }
  },

  /**
   * Get user's warm-up streak
   */
  async getUserStreak(userId: string) {
    try {
      const logs = await prisma.warmupLog.findMany({
        where: { user_id: userId },
        orderBy: { completed_at: 'desc' },
        take: 90, // Check last 90 days
      });

      if (logs.length === 0) {
        return { current_streak: 0, longest_streak: 0 };
      }

      // Calculate current streak
      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < logs.length; i++) {
        const logDate = new Date(logs[i].completed_at);
        logDate.setHours(0, 0, 0, 0);
        
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - i);
        expectedDate.setHours(0, 0, 0, 0);

        if (logDate.getTime() === expectedDate.getTime()) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 1;

      for (let i = 1; i < logs.length; i++) {
        const prevDate = new Date(logs[i - 1].completed_at);
        const currDate = new Date(logs[i].completed_at);
        
        prevDate.setHours(0, 0, 0, 0);
        currDate.setHours(0, 0, 0, 0);
        
        const dayDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);

      return {
        current_streak: currentStreak,
        longest_streak: longestStreak,
        total_warmups: logs.length,
      };
    } catch (error) {
      console.error('Error getting warmup streak:', error);
      throw error;
    }
  },

  /**
   * Get warm-up stats for admin dashboard
   */
  async getStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalWarmups, todayWarmups, activeUsers] = await Promise.all([
        prisma.warmupLog.count(),
        prisma.warmupLog.count({
          where: {
            completed_at: { gte: today },
          },
        }),
        prisma.warmupLog.groupBy({
          by: ['user_id'],
          where: {
            completed_at: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        }),
      ]);

      return {
        total_warmups: totalWarmups,
        today_warmups: todayWarmups,
        active_users_7d: activeUsers.length,
      };
    } catch (error) {
      console.error('Error getting warmup stats:', error);
      throw error;
    }
  },
};
