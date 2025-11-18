import { Router, Request, Response } from 'express';
import { referralService } from '../services/referralService';
import { authMiddleware } from '../middleware/auth';
import { basicAuthMiddleware } from '../middleware/basicAuth';

const router = Router();

/**
 * GET /api/referrals/leaderboard
 * Get monthly referral leaderboard with ranking
 * Query params: year, month, limit
 */
router.get('/leaderboard', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

    const data = await referralService.getMonthlyLeaderboard(year, month, limit);
    
    // Add ranking and format for frontend
    const leaderboard = data.leaderboard.map((entry, index) => ({
      rank: index + 1,
      handle: entry.handle,
      wallet: entry.user_id,
      referral_count: entry.referral_count,
      active_referrals: entry.referral_count, // For now, assume all are active
      is_current_user: entry.user_id === userId,
    }));

    res.json({ leaderboard });
  } catch (error: any) {
    console.error('Error fetching referral leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch referral leaderboard' });
  }
});

/**
 * GET /api/referrals/prize
 * Get current month's prize info and last month's winner
 */
router.get('/prize', async (req: Request, res: Response) => {
  try {
    const [prize, lastWinner] = await Promise.all([
      referralService.getCurrentPrize(),
      referralService.getLastMonthWinner(),
    ]);
    
    // Format for frontend
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    res.json({
      month: monthNames[prize.month - 1],
      prize_amount: prize.prize_amount,
      winner: lastWinner ? {
        handle: lastWinner.winner.handle,
        wallet: lastWinner.winner.user_id,
        referral_count: lastWinner.winner.referral_count,
      } : null,
      announced: !!lastWinner,
    });
  } catch (error: any) {
    console.error('Error fetching prize info:', error);
    res.status(500).json({ error: 'Failed to fetch prize info' });
  }
});

/**
 * GET /api/referrals/winner
 * Get last month's winner
 */
router.get('/winner', async (req: Request, res: Response) => {
  try {
    const winner = await referralService.getLastMonthWinner();
    res.json(winner);
  } catch (error: any) {
    console.error('Error fetching winner:', error);
    res.status(500).json({ error: 'Failed to fetch winner' });
  }
});

/**
 * GET /api/referrals/my-stats
 * Get authenticated user's referral stats
 */
router.get('/my-stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const stats = await referralService.getUserStats(userId);
    
    // Format for frontend
    res.json({
      total_referrals: stats.total_referrals,
      active_referrals: stats.activated_referrals,
      pending_referrals: stats.total_referrals - stats.activated_referrals,
      total_rewards: 0, // TODO: Calculate based on rewards system
      current_rank: stats.current_month_rank,
    });
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

/**
 * GET /api/referrals/my-referrals
 * Get authenticated user's referral history
 */
router.get('/my-referrals', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const referrals = await referralService.getUserReferrals(userId, limit);
    res.json({ referrals });
  } catch (error: any) {
    console.error('Error fetching user referrals:', error);
    res.status(500).json({ error: 'Failed to fetch user referrals' });
  }
});

/**
 * POST /api/referrals/admin/mark-paid
 * Mark winner as paid (admin only)
 * Body: { year, month, user_id, tx_hash }
 */
router.post('/admin/mark-paid', basicAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { year, month, user_id, tx_hash } = req.body;

    if (!year || !month || !user_id) {
      return res.status(400).json({ error: 'year, month, and user_id are required' });
    }

    const result = await referralService.markWinnerPaid(
      parseInt(year),
      parseInt(month),
      user_id,
      tx_hash
    );

    res.json(result);
  } catch (error: any) {
    console.error('Error marking winner as paid:', error);
    res.status(500).json({ error: 'Failed to mark winner as paid' });
  }
});

/**
 * GET /api/referrals/admin/stats
 * Get referral stats for admin dashboard
 */
router.get('/admin/stats', basicAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const stats = await referralService.getAdminStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

export default router;
