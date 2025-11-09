import { Router, Request, Response } from 'express';
import { settingsService } from '../services/settingsService';
import { basicAuthMiddleware } from '../middleware/basicAuth';

const router = Router();

// Public: Get countdown settings
router.get('/countdown', async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await settingsService.getCountdownSettings();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get all settings
router.get('/admin/all', basicAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await settingsService.getAllSettings();
    res.json({ settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update setting
router.put('/admin/:key', basicAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (!value) {
      res.status(400).json({ error: 'Value is required' });
      return;
    }

    await settingsService.updateSetting(key, value, 'admin');
    res.json({ success: true, message: 'Setting updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as settingsRoutes };
