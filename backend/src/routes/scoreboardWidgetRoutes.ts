import { Router, Request, Response } from 'express';
import { scoreboardWidgetService } from '../services/scoreboardWidgetService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * GET /api/widgets/world-index
 * Get World Index (Top 10 countries)
 */
router.get('/world-index', async (req: Request, res: Response) => {
  try {
    const worldIndex = await scoreboardWidgetService.getWorldIndex();
    res.json(worldIndex);
  } catch (error: any) {
    console.error('Error fetching world index:', error);
    res.status(500).json({ error: 'Failed to fetch world index' });
  }
});

/**
 * GET /api/widgets/my-impact
 * Get user's personal impact widget (auth required)
 */
router.get('/my-impact', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const impact = await scoreboardWidgetService.getUserImpact(userId);
    res.json(impact);
  } catch (error: any) {
    console.error('Error fetching user impact:', error);
    res.status(500).json({ error: 'Failed to fetch user impact' });
  }
});

/**
 * GET /api/widgets/upcoming-burns
 * Get upcoming burns board
 */
router.get('/upcoming-burns', async (req: Request, res: Response) => {
  try {
    const burns = await scoreboardWidgetService.getUpcomingBurns();
    res.json(burns);
  } catch (error: any) {
    console.error('Error fetching upcoming burns:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming burns' });
  }
});

/**
 * GET /api/widgets/current-season
 * Get current season info
 */
router.get('/current-season', async (req: Request, res: Response) => {
  try {
    const season = await scoreboardWidgetService.getCurrentSeason();
    res.json(season);
  } catch (error: any) {
    console.error('Error fetching current season:', error);
    res.status(500).json({ error: 'Failed to fetch current season' });
  }
});

/**
 * GET /api/widgets/streak-burn-stats
 * Get streak and burn visibility (auth required)
 */
router.get('/streak-burn-stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const stats = await scoreboardWidgetService.getStreakBurnStats(userId);
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching streak burn stats:', error);
    res.status(500).json({ error: 'Failed to fetch streak burn stats' });
  }
});

/**
 * GET /api/widgets/all
 * Get all scoreboard widgets for authenticated user
 */
router.get('/all', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const widgets = await scoreboardWidgetService.getAllWidgets(userId);
    res.json(widgets);
  } catch (error: any) {
    console.error('Error fetching all widgets:', error);
    res.status(500).json({ error: 'Failed to fetch all widgets' });
  }
});

export default router;
