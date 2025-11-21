import { PrismaClient } from '@prisma/client';
import { getMealsByCountry, getMealOfTheDay, MealItem } from '../data/mealCatalog';

const prisma = new PrismaClient();

export const mealService = {
  /**
   * Get meals by country with filters
   */
  async getMeals(
    countryCode: string,
    category?: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    tier?: 'budget' | 'balanced' | 'protein-boost'
  ) {
    try {
      const meals = getMealsByCountry(countryCode, category, tier);
      return meals;
    } catch (error) {
      console.error('Error getting meals:', error);
      throw error;
    }
  },

  /**
   * Get meal of the day for a country
   */
  async getMealOfDay(
    countryCode: string,
    category: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'lunch'
  ) {
    try {
      const meal = getMealOfTheDay(countryCode, category);
      return meal;
    } catch (error) {
      console.error('Error getting meal of the day:', error);
      throw error;
    }
  },

  /**
   * Log meal completion and award XP
   */
  async completeMeal(userId: string, mealId: string) {
    try {
      // Check if already logged today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingLog = await prisma.mealLog.findFirst({
        where: {
          user_id: userId,
          logged_at: {
            gte: today,
          },
        },
      });

      if (existingLog) {
        return {
          success: false,
          message: 'Meal already logged today',
          xp_awarded: 0,
        };
      }

      // Get meal details from catalog
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { country_code: true },
      });

      const countryCode = user?.country_code || 'US';
      const allMeals = getMealsByCountry(countryCode);
      const meal = allMeals.find(m => m.id === mealId);
      
      const xpReward = meal?.xp_reward || 5;

      // Create meal log
      const mealLog = await prisma.mealLog.create({
        data: {
          user_id: userId,
          meal_id: mealId,
          meal_type: meal?.category || 'lunch',
          calories: meal?.calories || 0,
          xp_earned: xpReward,
          logged_at: new Date(),
        },
      });

      // Award XP via XP service
      const xpService = require('./xpService').xpService;
      const xpResult = await xpService.awardXP({
        userId,
        actionKey: 'meal_log',
        metadata: {
          meal_id: mealId,
          meal_log_id: mealLog.id,
        },
      });

      console.log('[MEAL-SERVICE] XP award result:', xpResult);

      // Update user's last activity - using unsafe raw query to bypass schema validation
      await prisma.$executeRawUnsafe(
        `UPDATE users SET last_activity_date = CURRENT_TIMESTAMP WHERE id = $1`,
        userId
      );

      return {
        success: true,
        message: 'Meal logged successfully!',
        xp_awarded: xpResult.xpEarned,
        log: mealLog,
      };
    } catch (error) {
      console.error('Error completing meal:', error);
      throw error;
    }
  },

  /**
   * Get user's meal history
   */
  async getUserHistory(userId: string, limit: number = 30) {
    try {
      const logs = await prisma.mealLog.findMany({
        where: { user_id: userId },
        orderBy: { logged_at: 'desc' },
        take: limit,
      });

      return logs;
    } catch (error) {
      console.error('Error getting meal history:', error);
      throw error;
    }
  },

  /**
   * Get user's meal streak
   */
  async getUserStreak(userId: string) {
    try {
      const logs = await prisma.mealLog.findMany({
        where: { user_id: userId },
        orderBy: { logged_at: 'desc' },
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
        const logDate = new Date(logs[i].logged_at);
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
        const prevDate = new Date(logs[i - 1].logged_at);
        const currDate = new Date(logs[i].logged_at);
        
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
        total_meals: logs.length,
      };
    } catch (error) {
      console.error('Error getting meal streak:', error);
      throw error;
    }
  },

  /**
   * Get meal stats for admin dashboard
   */
  async getStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalMeals, todayMeals, activeUsers] = await Promise.all([
        prisma.mealLog.count(),
        prisma.mealLog.count({
          where: {
            logged_at: { gte: today },
          },
        }),
        prisma.mealLog.groupBy({
          by: ['user_id'],
          where: {
            logged_at: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        }),
      ]);

      return {
        total_meals: totalMeals,
        today_meals: todayMeals,
        active_users_7d: activeUsers.length,
      };
    } catch (error) {
      console.error('Error getting meal stats:', error);
      throw error;
    }
  },
};
