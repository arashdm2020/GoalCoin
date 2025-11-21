import { Router, Request, Response } from 'express';
import { warmupService } from '../services/warmupService';
import { authMiddleware } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/warmups/moves
 * Get all available warm-up moves
 */
router.get('/moves', async (req: Request, res: Response) => {
  try {
    const moves = await warmupService.getAllMoves();
    res.json({ moves });
  } catch (error: any) {
    console.error('Error fetching warmup moves:', error);
    res.status(500).json({ error: 'Failed to fetch warmup moves' });
  }
});

/**
 * GET /api/warmups/routines
 * Get all pre-defined routines
 */
router.get('/routines', async (req: Request, res: Response) => {
  try {
    const routines = await warmupService.getAllRoutines();
    res.json({ routines });
  } catch (error: any) {
    console.error('Error fetching warmup routines:', error);
    res.status(500).json({ error: 'Failed to fetch warmup routines' });
  }
});

/**
 * GET /api/warmups/today
 * Get today's recommended warm-up for authenticated user
 */
router.get('/today', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const routine = await warmupService.getTodaysRoutine(userId);
    res.json({ routine });
  } catch (error: any) {
    console.error('Error fetching today\'s warmup:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s warmup' });
  }
});

/**
 * POST /api/warmups/complete
 * Log warm-up completion and award XP
 * Body: { routine_id: string }
 */
router.post('/complete', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { routine_id } = req.body;

    if (!routine_id) {
      return res.status(400).json({ error: 'routine_id is required' });
    }

    const result = await warmupService.completeWarmup(userId, routine_id);
    res.json(result);
  } catch (error: any) {
    console.error('Error completing warmup:', error);
    res.status(500).json({ error: 'Failed to complete warmup' });
  }
});

/**
 * GET /api/warmups/history
 * Get user's warm-up history
 */
router.get('/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const limit = parseInt(req.query.limit as string) || 30;

    const history = await warmupService.getUserHistory(userId, limit);
    res.json({ history });
  } catch (error: any) {
    console.error('Error fetching warmup history:', error);
    res.status(500).json({ error: 'Failed to fetch warmup history' });
  }
});

/**
 * GET /api/warmups/streak
 * Get user's warm-up streak
 */
router.get('/streak', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const streak = await warmupService.getUserStreak(userId);
    res.json(streak);
  } catch (error: any) {
    console.error('Error fetching warmup streak:', error);
    res.status(500).json({ error: 'Failed to fetch warmup streak' });
  }
});

/**
 * GET /api/warmup/stats
 * Get user's warm-up stats
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get user's warmup count and streak
    const warmupCount = await prisma.warmupLog.count({
      where: { user_id: userId }
    });
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { current_streak: true, xp_points: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      current_streak: user.current_streak || 0,
      total_sessions: warmupCount,
      total_xp_earned: user.xp_points || 0
    });
  } catch (error: any) {
    console.error('Error fetching warmup stats:', error);
    res.status(500).json({ error: 'Failed to fetch warmup stats', details: error.message });
  }
});

/**
 * POST /api/warmup/complete
 * Complete a warmup session and award XP
 */
router.post('/complete', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { routine_name, duration_seconds } = req.body;
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const { xpService } = require('../services/xpService');
    const { streakService } = require('../services/streakService');
    
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
      return res.status(400).json({ 
        error: 'Warmup already completed today',
        message: 'You can only complete one warmup session per day'
      });
    }
    
    // Log warmup
    const warmupLog = await prisma.warmupLog.create({
      data: {
        user_id: userId,
        routine_name: routine_name || 'Quick Warmup',
        duration_seconds: duration_seconds || 300,
        completed_at: new Date()
      }
    });
    
    // Award XP using correct action key
    const xpResult = await xpService.awardXP({
      userId,
      actionKey: 'warmup_session',
      metadata: { 
        routine_name, 
        duration_seconds, 
        warmup_log_id: warmupLog.id 
      }
    });
    
    // Update streak
    await streakService.updateUserStreak(userId);
    
    res.json({
      success: true,
      xp_earned: xpResult.xpEarned,
      message: xpResult.message,
      streak_updated: true
    });
  } catch (error: any) {
    console.error('Error completing warmup:', error);
    res.status(500).json({ error: 'Failed to complete warmup', details: error.message });
  }
});

export default router;
