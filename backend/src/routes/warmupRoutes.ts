import { Router, Request, Response } from 'express';
import { warmupService } from '../services/warmupService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

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
 * GET /api/warmups/stats
 * Get warm-up stats (admin only)
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await warmupService.getStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching warmup stats:', error);
    res.status(500).json({ error: 'Failed to fetch warmup stats' });
  }
});

export default router;
