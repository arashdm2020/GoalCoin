import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService';
import { basicAuthMiddleware } from '../middleware/basicAuth';

const router = Router();

/**
 * GET /api/analytics/metrics
 * Get platform metrics (admin only)
 */
router.get('/metrics', basicAuthMiddleware, async (req: Request, res: Response) => {
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
