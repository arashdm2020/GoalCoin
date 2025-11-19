import { Router, Request, Response } from 'express';
import { xpService } from '../services/xpService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Award XP for an action
router.post('/event', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { actionKey, idempotencyKey, metadata } = req.body;
    const userId = (req as any).user.id;

    if (!actionKey) {
      res.status(400).json({ error: 'actionKey is required' });
      return;
    }

    const result = await xpService.awardXP({
      userId,
      actionKey,
      idempotencyKey,
      metadata
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get available actions
router.get('/actions', async (req: Request, res: Response): Promise<void> => {
  try {
    const actions = await xpService.getActions();
    res.json(actions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user XP history
router.get('/history', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const limit = parseInt(req.query.limit as string) || 50;

    const events = await xpService.getUserXPHistory(userId, limit);
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user XP logs (formatted for frontend)
router.get('/logs', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const limit = parseInt(req.query.limit as string) || 100;

    const events = await xpService.getUserXPHistory(userId, limit);
    
    // Get user's total XP
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp_points: true }
    });

    // Format logs for frontend
    const logs = events.map((event: any) => ({
      id: event.id,
      action_type: event.action_key || 'unknown',
      xp_earned: event.xp_awarded || 0,
      description: event.metadata?.description || `Earned XP from ${event.action_key}`,
      created_at: event.created_at,
      metadata: event.metadata
    }));

    res.json({
      logs,
      total_xp: user?.xp_points || 0,
      count: logs.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as xpRoutes };
