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
 * Get full daily meal plan (breakfast, lunch, dinner)
 * Query params: country, region
 */
router.get('/today', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { region } = req.query;
    
    // Get user's country if not specified
    let countryCode = 'US';
    if (!region || region === 'auto') {
      const user = await require('@prisma/client').PrismaClient().user.findUnique({
        where: { id: userId },
        select: { country_code: true },
      });
      countryCode = user?.country_code || 'US';
    } else {
      // Map region to a representative country code
      const regionMap: Record<string, string> = {
        'middle_east': 'SA',
        'north_america': 'US',
        'europe': 'GB',
        'asia': 'CN',
        'africa': 'NG',
      };
      countryCode = regionMap[region as string] || 'US';
    }
    
    // Get meals for all three categories
    const breakfast = await mealService.getMealOfDay(countryCode, 'breakfast');
    const lunch = await mealService.getMealOfDay(countryCode, 'lunch');
    const dinner = await mealService.getMealOfDay(countryCode, 'dinner');
    
    // Validate that all meals were found
    if (!breakfast || !lunch || !dinner) {
      console.error('Missing meal data:', { breakfast: !!breakfast, lunch: !!lunch, dinner: !!dinner });
      return res.status(500).json({ 
        error: 'Failed to generate complete meal plan',
        details: 'Some meals are missing from the catalog'
      });
    }
    
    res.json({
      breakfast,
      lunch,
      dinner,
      region: region || 'auto',
      country: countryCode,
    });
  } catch (error: any) {
    console.error('Error fetching meal plan:', error);
    res.status(500).json({ error: 'Failed to fetch meal plan' });
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
 * Get user's meal stats
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const streak = await mealService.getUserStreak(userId);
    
    // Calculate total XP from meals
    const prisma = new (require('@prisma/client').PrismaClient)();
    const logs = await prisma.mealLog.findMany({
      where: { user_id: userId },
      select: { xp_earned: true },
    });
    const total_xp_earned = logs.reduce((sum: number, log: any) => sum + log.xp_earned, 0);
    
    res.json({
      current_streak: streak.current_streak || 0,
      total_meals: streak.total_meals || 0,
      total_xp_earned,
    });
  } catch (error: any) {
    console.error('Error fetching meal stats:', error);
    res.status(500).json({ error: 'Failed to fetch meal stats' });
  }
});

export default router;
