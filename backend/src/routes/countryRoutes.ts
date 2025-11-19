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

/**
 * GET /api/country/name/:code
 * Get country name from country code
 */
router.get('/name/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const countryName = (countryDetectionService as any).getCountryName(code.toUpperCase());
    
    res.json({
      success: true,
      country_code: code.toUpperCase(),
      country_name: countryName,
    });
  } catch (error: any) {
    console.error('[COUNTRY] Name lookup error:', error);
    res.status(500).json({ 
      error: 'Failed to get country name',
      country_code: req.params.code,
      country_name: req.params.code,
    });
  }
});

export { router as countryRoutes };
