import { Router, Request, Response } from 'express';
import { mealService } from '../services/mealService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * GET /api/meals
 * Get meals by country with optional filters
 * Query params: country, category, tier
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { country = 'US', category, tier } = req.query;
    
    const meals = await mealService.getMeals(
      country as string,
      category as any,
      tier as any
    );
    
    res.json({ meals });
  } catch (error: any) {
    console.error('Error fetching meals:', error);
    res.status(500).json({ error: 'Failed to fetch meals' });
  }
});

/**
 * GET /api/meals/today
 * Get meal of the day for a country
 * Query params: country, category
 */
router.get('/today', async (req: Request, res: Response) => {
  try {
    const { country = 'US', category = 'lunch' } = req.query;
    
    const meal = await mealService.getMealOfDay(
      country as string,
      category as any
    );
    
    res.json({ meal });
  } catch (error: any) {
    console.error('Error fetching meal of the day:', error);
    res.status(500).json({ error: 'Failed to fetch meal of the day' });
  }
});

/**
 * POST /api/meals/complete
 * Log meal completion and award XP
 * Body: { meal_id: string }
 */
router.post('/complete', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { meal_id } = req.body;

    if (!meal_id) {
      return res.status(400).json({ error: 'meal_id is required' });
    }

    const result = await mealService.completeMeal(userId, meal_id);
    res.json(result);
  } catch (error: any) {
    console.error('Error completing meal:', error);
    res.status(500).json({ error: 'Failed to complete meal' });
  }
});

/**
 * GET /api/meals/history
 * Get user's meal history
 */
router.get('/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const limit = parseInt(req.query.limit as string) || 30;

    const history = await mealService.getUserHistory(userId, limit);
    res.json({ history });
  } catch (error: any) {
    console.error('Error fetching meal history:', error);
    res.status(500).json({ error: 'Failed to fetch meal history' });
  }
});

/**
 * GET /api/meals/streak
 * Get user's meal streak
 */
router.get('/streak', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const streak = await mealService.getUserStreak(userId);
    res.json(streak);
  } catch (error: any) {
    console.error('Error fetching meal streak:', error);
    res.status(500).json({ error: 'Failed to fetch meal streak' });
  }
});

/**
 * GET /api/meals/stats
 * Get meal stats (admin only)
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await mealService.getStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching meal stats:', error);
    res.status(500).json({ error: 'Failed to fetch meal stats' });
  }
});

export default router;
