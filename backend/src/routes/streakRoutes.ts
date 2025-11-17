import { Router, Request, Response } from 'express';
import { streakService } from '../services/streakService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * GET /api/streak/current
 * Get current user's streak (real-time calculation)
 */
router.get('/current', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const streak = await streakService.calculateUserStreak(userId);
    
    res.json({
      success: true,
      ...streak,
    });
  } catch (error: any) {
    console.error('[STREAK] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/streak/update
 * Manually trigger streak update for current user
 */
router.post('/update', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await streakService.updateUserStreak(userId);
    const streak = await streakService.calculateUserStreak(userId);
    
    res.json({
      success: true,
      message: 'Streak updated successfully',
      ...streak,
    });
  } catch (error: any) {
    console.error('[STREAK] Update error:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as streakRoutes };
