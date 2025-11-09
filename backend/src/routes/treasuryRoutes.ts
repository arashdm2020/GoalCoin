import { Router, Request, Response } from 'express';
import { treasuryService } from '../services/treasuryService';
import { basicAuthMiddleware } from '../middleware/basicAuth';

const router = Router();

// Public: Get burn events history
router.get('/burn-events', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const events = await treasuryService.getBurnHistory(limit);
    const totalBurned = await treasuryService.getTotalBurned();

    res.json({
      events,
      totalBurned,
      count: events.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Create burn event
router.post('/admin/burn-events', basicAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { amountGoalcoin, source, txHash } = req.body;

    if (!amountGoalcoin || !source) {
      res.status(400).json({ error: 'amountGoalcoin and source are required' });
      return;
    }

    const result = await treasuryService.createBurnEvent({
      amountGoalcoin,
      source,
      txHash
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update burn event with tx hash
router.patch('/admin/burn-events/:id', basicAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { txHash } = req.body;

    if (!txHash) {
      res.status(400).json({ error: 'txHash is required' });
      return;
    }

    await treasuryService.updateBurnEvent(id, txHash);
    res.json({ success: true, message: 'Burn event updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Initiate buyback
router.post('/admin/buyback', basicAuthMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, currency, source } = req.body;

    if (!amount || !currency || !source) {
      res.status(400).json({ error: 'amount, currency, and source are required' });
      return;
    }

    const result = await treasuryService.buyback({ amount, currency, source });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as treasuryRoutes };
