/**
 * Streak Service - Centralized streak calculation
 * Ensures consistency across all devices and endpoints
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface StreakResult {
  current_streak: number;
  longest_streak: number;
  last_activity_date: Date | null;
}

class StreakService {
  /**
   * Calculate user's current streak based on activity logs
   * Checks warmup, workout, meal, and submission logs
   */
  async calculateUserStreak(userId: string): Promise<StreakResult> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all activity dates from different sources
      const [warmupLogs, workoutLogs, mealLogs, submissions] = await Promise.all([
        prisma.warmupLog.findMany({
          where: { user_id: userId },
          select: { completed_at: true },
          orderBy: { completed_at: 'desc' },
        }),
        prisma.workoutLog.findMany({
          where: { user_id: userId },
          select: { completed_at: true },
          orderBy: { completed_at: 'desc' },
        }),
        prisma.mealLog.findMany({
          where: { user_id: userId },
          select: { logged_at: true },
          orderBy: { logged_at: 'desc' },
        }),
        prisma.submission.findMany({
          where: { user_id: userId },
          select: { created_at: true },
          orderBy: { created_at: 'desc' },
        }),
      ]);

      // Combine all activity dates
      const allDates: Date[] = [
        ...warmupLogs.map(l => l.completed_at),
        ...workoutLogs.map(l => l.completed_at),
        ...mealLogs.map(l => l.logged_at),
        ...submissions.map(s => s.created_at),
      ].sort((a, b) => b.getTime() - a.getTime());

      if (allDates.length === 0) {
        return {
          current_streak: 0,
          longest_streak: 0,
          last_activity_date: null,
        };
      }

      // Get unique days (ignore time)
      const uniqueDays = new Set<string>();
      allDates.forEach(date => {
        const dayKey = date.toISOString().split('T')[0];
        uniqueDays.add(dayKey);
      });

      const sortedDays = Array.from(uniqueDays).sort().reverse();

      // Calculate current streak
      let currentStreak = 0;
      let checkDate = new Date(today);
      
      for (const dayStr of sortedDays) {
        const activityDate = new Date(dayStr);
        activityDate.setHours(0, 0, 0, 0);
        
        const diffDays = Math.floor((checkDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0 || diffDays === 1) {
          currentStreak++;
          checkDate = new Date(activityDate);
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 1;
      
      for (let i = 0; i < sortedDays.length - 1; i++) {
        const current = new Date(sortedDays[i]);
        const next = new Date(sortedDays[i + 1]);
        const diffDays = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
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
        last_activity_date: allDates[0],
      };
    } catch (error) {
      console.error('Error calculating streak:', error);
      return {
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: null,
      };
    }
  }

  /**
   * Update user's streak in database
   */
  async updateUserStreak(userId: string): Promise<void> {
    try {
      const streak = await this.calculateUserStreak(userId);
      
      await prisma.user.update({
        where: { id: userId },
        data: {
          current_streak: streak.current_streak,
          longest_streak: Math.max(
            streak.longest_streak,
            (await prisma.user.findUnique({ where: { id: userId } }))?.longest_streak || 0
          ),
          last_activity_date: streak.last_activity_date,
        },
      });
    } catch (error) {
      console.error('Error updating user streak:', error);
    }
  }

  /**
   * Get streak for multiple users (for leaderboard)
   */
  async calculateMultipleStreaks(userIds: string[]): Promise<Map<string, StreakResult>> {
    const results = new Map<string, StreakResult>();
    
    await Promise.all(
      userIds.map(async (userId) => {
        const streak = await this.calculateUserStreak(userId);
        results.set(userId, streak);
      })
    );
    
    return results;
  }
}

export const streakService = new StreakService();
