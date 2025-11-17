import { Router, Request, Response } from 'express';
import { countryDetectionService } from '../services/countryDetectionService';

const router = Router();

/**
 * GET /api/country/detect
 * Detect user's country from IP
 */
router.get('/detect', async (req: Request, res: Response) => {
  try {
    const ip = countryDetectionService.getClientIP(req);
    const result = await countryDetectionService.detectCountry(ip, req.headers);
    
    res.json({
      success: true,
      ...result,
      ip: ip,
    });
  } catch (error: any) {
    console.error('[COUNTRY] Detection error:', error);
    res.status(500).json({ 
      error: 'Failed to detect country',
      country_code: 'US',
      country_name: 'United States',
      detected_from: 'default',
    });
  }
});

export { router as countryRoutes };
