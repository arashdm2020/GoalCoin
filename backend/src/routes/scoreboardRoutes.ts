import { Router, Request, Response } from 'express';
import { countryLeaderboardService } from '../services/countryLeaderboardService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Get world index - Global top 10 countries
router.get('/world-index', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const leaderboard = await countryLeaderboardService.getGlobalLeaderboard(limit);
    
    res.json({
      title: '🌍 Global Country Rankings',
      subtitle: 'Top countries by EWBI score',
      countries: leaderboard,
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's country widget
router.get('/my-country', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    
    const rank = await countryLeaderboardService.getUserCountryRank(userId);
    const contribution = await countryLeaderboardService.getDailyContribution(userId);
    
    if (!rank) {
      res.status(404).json({ error: 'Country not found' });
      return;
    }

    res.json({
      countryRank: rank,
      contributionMessage: contribution,
      encouragement: `Keep going! Your efforts are helping ${rank.country} climb the ranks!`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get upcoming burn events
router.get('/burn-events', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const events = await req.app.locals.prisma.$queryRaw`
      SELECT * FROM burn_events
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    res.json({
      title: '🔥 Burn Events',
      events,
      totalBurned: events.reduce((sum: number, e: any) => sum + parseFloat(e.amount_goalcoin), 0)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as scoreboardRoutes };
