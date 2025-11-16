import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// XP reward constants
const XP_REWARDS = {
  WARMUP: 10,
  WORKOUT: 20,
  MEAL: 15,
  DAILY_STREAK: 5,
};

// Calculate streak and update user
async function updateUserStreak(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActivity = user.last_activity_date;
  
  if (!lastActivity) {
    // First activity
    await prisma.user.update({
      where: { id: userId },
      data: {
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: new Date(),
      },
    });
  } else {
    const lastActivityDate = new Date(lastActivity);
    lastActivityDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      // Same day, no streak update needed
      return;
    } else if (daysDiff === 1) {
      // Consecutive day, increment streak
      const newStreak = user.current_streak + 1;
      await prisma.user.update({
        where: { id: userId },
        data: {
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, user.longest_streak),
          last_activity_date: new Date(),
          xp_points: { increment: XP_REWARDS.DAILY_STREAK },
        },
      });
    } else {
      // Streak broken, reset to 1
      await prisma.user.update({
        where: { id: userId },
        data: {
          current_streak: 1,
          last_activity_date: new Date(),
        },
      });
    }
  }
}

// Get all warmup sessions
const getWarmupSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await prisma.warmupSession.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching warmup sessions:', error);
    res.status(500).json({ error: 'Failed to fetch warmup sessions' });
  }
};

// Log warmup completion
const logWarmup = async (req: Request, res: Response) => {
  try {
    const { userId, sessionId } = req.body;

    console.log('[WARMUP] Log request:', { userId, sessionId });

    if (!userId || !sessionId) {
      return res.status(400).json({ error: 'userId and sessionId are required' });
    }

    // Check if user already completed warmup today (XP farming prevention)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingLog = await prisma.warmupLog.findFirst({
      where: {
        user_id: userId,
        completed_at: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (existingLog) {
      console.log('[WARMUP] Already completed today:', existingLog.id);
      return res.status(400).json({ 
        error: 'Warmup already completed today',
        message: 'You can only complete one warmup session per day',
        completed_at: existingLog.completed_at,
      });
    }

    // Create warmup log
    const log = await prisma.warmupLog.create({
      data: {
        user_id: userId,
        session_id: sessionId,
        routine_id: 'session-based', // Legacy session-based warmup
        duration_seconds: 300,
        xp_earned: XP_REWARDS.WARMUP,
      },
    });

    console.log('[WARMUP] Log created:', log.id);

    // Update user XP - using raw query to avoid Prisma Client schema issues
    await prisma.$executeRaw`
      UPDATE users 
      SET xp_points = xp_points + ${XP_REWARDS.WARMUP}
      WHERE id = ${userId}
    `;

    // Update streak
    await updateUserStreak(userId);

    res.json({ success: true, log, xp_earned: XP_REWARDS.WARMUP });
  } catch (error) {
    console.error('Error logging warmup:', error);
    res.status(500).json({ error: 'Failed to log warmup' });
  }
};

// Log workout completion
const logWorkout = async (req: Request, res: Response) => {
  try {
    const { userId, workoutType, durationMin, notes } = req.body;

    console.log('[WORKOUT-LOG] Request:', { userId, workoutType, durationMin, notes });

    if (!userId || !workoutType || !durationMin) {
      console.log('[WORKOUT-LOG] Validation failed: missing required fields');
      return res.status(400).json({ error: 'userId, workoutType, and durationMin are required' });
    }

    // Create workout log
    const log = await prisma.workoutLog.create({
      data: {
        user_id: userId,
        workout_type: workoutType,
        duration_min: durationMin,
        notes: notes || null,
        xp_earned: XP_REWARDS.WORKOUT,
      },
    });

    console.log('[WORKOUT-LOG] Created log:', log.id);

    // Update user XP - using raw query to avoid Prisma Client schema issues
    await prisma.$executeRaw`
      UPDATE users 
      SET xp_points = xp_points + ${XP_REWARDS.WORKOUT}
      WHERE id = ${userId}
    `;

    // Update streak
    await updateUserStreak(userId);

    res.json({ success: true, log, xp_earned: XP_REWARDS.WORKOUT });
  } catch (error) {
    console.error('Error logging workout:', error);
    res.status(500).json({ error: 'Failed to log workout' });
  }
};

// Get diet plans
const getDietPlans = async (req: Request, res: Response) => {
  try {
    const { tier, region } = req.query;

    const where: any = { active: true };
    if (tier) where.tier = tier;
    if (region) where.region = region;

    const plans = await prisma.dietPlan.findMany({ where });
    res.json(plans);
  } catch (error) {
    console.error('Error fetching diet plans:', error);
    res.status(500).json({ error: 'Failed to fetch diet plans' });
  }
};

// Log meal completion
const logMeal = async (req: Request, res: Response) => {
  try {
    const { userId, planId } = req.body;

    if (!userId || !planId) {
      return res.status(400).json({ error: 'userId and planId are required' });
    }

    // Create meal log
    const log = await prisma.mealLog.create({
      data: {
        user_id: userId,
        plan_id: planId,
        meal_id: 'plan-based', // Legacy plan-based meal
        meal_type: 'lunch',
        calories: 0,
        xp_earned: XP_REWARDS.MEAL,
      },
    });

    // Update user XP - using raw query to avoid Prisma Client schema issues
    await prisma.$executeRaw`
      UPDATE users 
      SET xp_points = xp_points + ${XP_REWARDS.MEAL}
      WHERE id = ${userId}
    `;

    // Update streak
    await updateUserStreak(userId);

    res.json({ success: true, log, xp_earned: XP_REWARDS.MEAL });
  } catch (error) {
    console.error('Error logging meal:', error);
    res.status(500).json({ error: 'Failed to log meal' });
  }
};

// Get user progress (XP, streaks, etc.)
const getUserProgress = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        xp_points: true,
        goal_points: true,
        current_streak: true,
        longest_streak: true,
        burn_multiplier: true,
        last_activity_date: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get activity counts and workout history
    const [warmupCount, workoutCount, mealCount, workouts] = await Promise.all([
      prisma.warmupLog.count({ where: { user_id: userId } }),
      prisma.workoutLog.count({ where: { user_id: userId } }),
      prisma.mealLog.count({ where: { user_id: userId } }),
      prisma.workoutLog.findMany({
        where: { user_id: userId },
        orderBy: { completed_at: 'desc' },
        take: 100,
      }),
    ]);

    res.json({
      ...user,
      activity_counts: {
        warmups: warmupCount,
        workouts: workoutCount,
        meals: mealCount,
      },
      workouts,
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({ error: 'Failed to fetch user progress' });
  }
};

export default {
  getWarmupSessions,
  logWarmup,
  logWorkout,
  getDietPlans,
  logMeal,
  getUserProgress,
};
