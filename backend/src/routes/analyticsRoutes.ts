import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService';
import { adminAuthMiddleware } from '../middleware/adminAuth';

const router = Router();

/**
 * GET /api/analytics/dashboard
 * Get comprehensive analytics dashboard (admin only)
 */
router.get('/dashboard', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    console.log('Analytics dashboard request received');
    
    // Try each service method individually to identify the problematic one
    const results: any = {};
    
    try {
      results.platform = await analyticsService.getPlatformMetrics();
      console.log('Platform metrics fetched successfully');
    } catch (error) {
      console.error('Error fetching platform metrics:', error);
      results.platform = { dau: 0, mau: 0, total_users: 0, paid_users: 0, conversion_rate: 0 };
    }
    
    try {
      results.burn_treasury_timeline = await analyticsService.getBurnTreasuryTimeline();
      console.log('Burn treasury timeline fetched successfully');
    } catch (error) {
      console.error('Error fetching burn treasury timeline:', error);
      results.burn_treasury_timeline = { burnEvents: [], treasuryEvents: [] };
    }
    
    try {
      results.top_xp_actions = await analyticsService.getTopXPActions();
      console.log('Top XP actions fetched successfully');
    } catch (error) {
      console.error('Error fetching top XP actions:', error);
      results.top_xp_actions = [];
    }
    
    try {
      results.country_distribution = await analyticsService.getCountryDistribution();
      console.log('Country distribution fetched successfully');
    } catch (error) {
      console.error('Error fetching country distribution:', error);
      results.country_distribution = [];
    }
    
    results.generated_at = new Date().toISOString();
    
    console.log('Analytics dashboard response:', JSON.stringify(results, null, 2));
    res.json(results);
  } catch (error: any) {
    console.error('Error fetching dashboard:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch dashboard', details: error.message });
  }
});

/**
 * GET /api/analytics/metrics
 * Get platform metrics (admin only)
 */
router.get('/metrics', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    const metrics = await analyticsService.getPlatformMetrics(days);
    res.json(metrics);
  } catch (error: any) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

/**
 * GET /api/analytics/funnel
 * Get signup funnel metrics (admin only)
 */
router.get('/funnel', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const funnel = await analyticsService.getSignupFunnel(days);
    res.json(funnel);
  } catch (error: any) {
    console.error('Error fetching funnel:', error);
    res.status(500).json({ error: 'Failed to fetch funnel' });
  }
});

/**
 * GET /api/analytics/retention
 * Get retention metrics (admin only)
 */
router.get('/retention', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const retention = await analyticsService.getRetentionMetrics();
    res.json(retention);
  } catch (error: any) {
    console.error('Error fetching retention:', error);
    res.status(500).json({ error: 'Failed to fetch retention' });
  }
});

/**
 * GET /api/analytics/xp-per-dau
 * Get XP per DAU (admin only)
 */
router.get('/xp-per-dau', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const xpPerDAU = await analyticsService.getXPPerDAU();
    res.json(xpPerDAU);
  } catch (error: any) {
    console.error('Error fetching XP per DAU:', error);
    res.status(500).json({ error: 'Failed to fetch XP per DAU' });
  }
});

/**
 * GET /api/analytics/countries
 * Get country distribution (admin only)
 */
router.get('/countries', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const countries = await analyticsService.getCountryDistribution();
    res.json(countries);
  } catch (error: any) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

/**
 * GET /api/analytics/top-actions
 * Get top XP actions (admin only)
 */
router.get('/top-actions', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    const actions = await analyticsService.getTopXPActions(days);
    res.json(actions);
  } catch (error: any) {
    console.error('Error fetching top actions:', error);
    res.status(500).json({ error: 'Failed to fetch top actions' });
  }
});

/**
 * GET /api/analytics/timeline
 * Get burn and treasury timeline (admin only)
 */
router.get('/timeline', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const timeline = await analyticsService.getBurnTreasuryTimeline(days);
    res.json(timeline);
  } catch (error: any) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

/**
 * GET /api/analytics/errors
 * Get error and latency metrics (admin only)
 */
router.get('/errors', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;
    const errors = await analyticsService.getErrorMetrics(hours);
    res.json(errors);
  } catch (error: any) {
    console.error('Error fetching errors:', error);
    res.status(500).json({ error: 'Failed to fetch errors' });
  }
});

/**
 * POST /api/analytics/track
 * Track an event
 */
router.post('/track', async (req: Request, res: Response) => {
  try {
    const { eventName, userId, properties, countryCode } = req.body;

    if (!eventName) {
      return res.status(400).json({ error: 'eventName is required' });
    }

    await analyticsService.trackEvent({
      eventName,
      userId,
      properties,
      countryCode,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking event:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

export default router;
