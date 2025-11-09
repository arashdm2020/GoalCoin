import { Router, Request, Response } from 'express';
import { countryLeaderboardService } from '../services/countryLeaderboardService';
import { authMiddleware } from '../middleware/auth';
import { basicAuthMiddleware } from '../middleware/basicAuth';

const router = Router();

// Get global country leaderboard
router.get('/country', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const season = req.query.season as string;

    const leaderboard = await countryLeaderboardService.getGlobalLeaderboard(limit, season);
    res.json(leaderboard);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get regional leaderboard
router.get('/country/region/:region', async (req: Request, res: Response): Promise<void> => {
  try {
    const { region } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const leaderboard = await countryLeaderboardService.getRegionalLeaderboard(region, limit);
    res.json(leaderboard);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's country rank
router.get('/my-country', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const rank = await countryLeaderboardService.getUserCountryRank(userId);
    
    if (!rank) {
      res.status(404).json({ error: 'Country not found or user has no country set' });
      return;
    }

    res.json(rank);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's daily contribution message
router.get('/my-contribution', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const message = await countryLeaderboardService.getDailyContribution(userId);
    res.json({ message });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update buffer factor for a country
router.patch('/admin/country-buffer/:countryCode', basicAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { countryCode } = req.params;
    const { bufferFactor } = req.body;

    if (!bufferFactor || bufferFactor < 0) {
      res.status(400).json({ error: 'Valid bufferFactor is required' });
      return;
    }

    await countryLeaderboardService.updateBufferFactor(countryCode, bufferFactor);
    res.json({ success: true, message: `Buffer factor updated for ${countryCode}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update global buffer factor
router.patch('/admin/global-buffer', basicAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { bufferFactor } = req.body;

    if (!bufferFactor || bufferFactor < 0) {
      res.status(400).json({ error: 'Valid bufferFactor is required' });
      return;
    }

    await countryLeaderboardService.updateGlobalBufferFactor(bufferFactor);
    res.json({ success: true, message: 'Global buffer factor updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as countryLeaderboardRoutes };
