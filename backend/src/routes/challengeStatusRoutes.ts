import { Router, Request, Response } from 'express';
import { challengeService } from '../services/challengeService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * GET /api/challenge/status
 * Get current challenge status (public)
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await challengeService.getStatus();
    
    res.json({
      success: true,
      ...status,
    });
  } catch (error: any) {
    console.error('[CHALLENGE] Status error:', error);
    res.status(500).json({ 
      error: 'Failed to get challenge status',
      maxParticipants: 200,
      currentParticipants: 0,
      remainingSpots: 200,
      isFull: false,
    });
  }
});

/**
 * POST /api/challenge/join
 * Check if user can join (requires auth)
 */
router.post('/join', authMiddleware, async (req: Request, res: Response) => {
  try {
    const eligibility = await challengeService.canJoin();
    
    res.json({
      success: true,
      ...eligibility,
    });
  } catch (error: any) {
    console.error('[CHALLENGE] Join check error:', error);
    res.status(500).json({ 
      error: 'Failed to check eligibility',
      allowed: false,
    });
  }
});

/**
 * POST /api/challenge/waitlist
 * Add user to waitlist
 */
router.post('/waitlist', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await challengeService.addToWaitlist(email, name);
    
    res.json(result);
  } catch (error: any) {
    console.error('[CHALLENGE] Waitlist error:', error);
    res.status(500).json({ 
      error: 'Failed to add to waitlist',
      success: false,
    });
  }
});

export { router as challengeStatusRoutes };
