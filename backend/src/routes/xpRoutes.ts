import { Router, Request, Response } from 'express';
import { xpService } from '../services/xpService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Award XP for an action
router.post('/event', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { actionKey, idempotencyKey, metadata } = req.body;
    const userId = (req as any).user.id;

    if (!actionKey) {
      res.status(400).json({ error: 'actionKey is required' });
      return;
    }

    const result = await xpService.awardXP({
      userId,
      actionKey,
      idempotencyKey,
      metadata
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get available actions
router.get('/actions', async (req: Request, res: Response): Promise<void> => {
  try {
    const actions = await xpService.getActions();
    res.json(actions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user XP history
router.get('/history', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const limit = parseInt(req.query.limit as string) || 50;

    const events = await xpService.getUserXPHistory(userId, limit);
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user XP logs (formatted for frontend)
router.get('/logs', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const limit = parseInt(req.query.limit as string) || 100;

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Get user's total XP
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp_points: true }
    });

    // Fetch logs from warmup_logs, workout_logs, and meal_logs
    const [warmupLogs, workoutLogs, mealLogs] = await Promise.all([
      prisma.warmupLog.findMany({
        where: { user_id: userId },
        orderBy: { completed_at: 'desc' },
        take: limit,
        select: {
          id: true,
          xp_earned: true,
          completed_at: true,
          routine_id: true,
          duration_seconds: true
        }
      }),
      prisma.workoutLog.findMany({
        where: { user_id: userId },
        orderBy: { completed_at: 'desc' },
        take: limit,
        select: {
          id: true,
          xp_earned: true,
          completed_at: true,
          workout_type: true,
          duration_min: true,
          notes: true
        }
      }),
      prisma.mealLog.findMany({
        where: { user_id: userId },
        orderBy: { completed_at: 'desc' },
        take: limit,
        select: {
          id: true,
          xp_earned: true,
          completed_at: true,
          meal_type: true,
          calories: true
        }
      })
    ]);

    // Combine and format logs
    const allLogs = [
      ...warmupLogs.map((log: any) => ({
        id: log.id,
        action_type: 'warmup',
        xp_earned: log.xp_earned,
        description: `Completed warmup session (${Math.floor(log.duration_seconds / 60)} min)`,
        created_at: log.completed_at,
        metadata: { routine_id: log.routine_id, duration_seconds: log.duration_seconds }
      })),
      ...workoutLogs.map((log: any) => ({
        id: log.id,
        action_type: 'workout',
        xp_earned: log.xp_earned,
        description: `${log.workout_type} workout (${log.duration_min} min)${log.notes ? ': ' + log.notes : ''}`,
        created_at: log.completed_at,
        metadata: { workout_type: log.workout_type, duration_min: log.duration_min }
      })),
      ...mealLogs.map((log: any) => ({
        id: log.id,
        action_type: 'meal',
        xp_earned: log.xp_earned,
        description: `Logged ${log.meal_type} (${log.calories} cal)`,
        created_at: log.completed_at,
        metadata: { meal_type: log.meal_type, calories: log.calories }
      }))
    ];

    // Sort by date and limit
    const sortedLogs = allLogs
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);

    res.json({
      logs: sortedLogs,
      total_xp: user?.xp_points || 0,
      count: sortedLogs.length
    });
  } catch (error: any) {
    console.error('Error fetching XP logs:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as xpRoutes };
