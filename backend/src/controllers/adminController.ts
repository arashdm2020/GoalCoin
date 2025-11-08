import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuditService } from '../services/auditService';

const prisma = new PrismaClient();

export const adminController = {
  // --- Dashboard Stats ---
  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      // Get user counts and stats
      const totalUsers = await prisma.user.count();
      const activeUsers = await prisma.user.count({
        where: {
          last_activity_date: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      });

      // Get XP and streak stats
      const xpStats = await prisma.user.aggregate({
        _sum: { xp_points: true, goal_points: true },
        _avg: { current_streak: true, burn_multiplier: true },
      });

      // Get total burns
      const burnStats = await prisma.burnEvent.aggregate({
        _sum: { amount_goalcoin: true },
        _count: true,
      });

      // Get treasury stats (from pools_ledger)
      const treasuryStats = await prisma.poolsLedger.aggregate({
        _sum: {
          prize_usdt: true,
          treasury_usdt: true,
          burn_usdt: true,
        },
      });

      // Get activity counts
      const [warmupCount, workoutCount, mealCount] = await Promise.all([
        prisma.warmupLog.count(),
        prisma.workoutLog.count(),
        prisma.mealLog.count(),
      ]);

      // Get referral stats
      const referralStats = await prisma.referral.aggregate({
        _count: true,
        _sum: { reward_points: true },
      });

      // Get ad view stats
      const adViewStats = await prisma.adView.aggregate({
        _count: true,
        _sum: { reward_points: true },
      });

      res.json({
        success: true,
        stats: {
          users: {
            total: totalUsers,
            active_7d: activeUsers,
          },
          xp: {
            total_xp: xpStats._sum.xp_points || 0,
            total_goal_points: xpStats._sum.goal_points || 0,
            avg_streak: xpStats._avg.current_streak || 0,
            avg_burn_multiplier: xpStats._avg.burn_multiplier || 1.0,
          },
          burns: {
            total_goalcoin_burned: burnStats._sum.amount_goalcoin || 0,
            burn_events_count: burnStats._count || 0,
          },
          treasury: {
            total_prize_pool: treasuryStats._sum.prize_usdt || 0,
            total_treasury: treasuryStats._sum.treasury_usdt || 0,
            total_burned_usdt: treasuryStats._sum.burn_usdt || 0,
          },
          activity: {
            warmups: warmupCount,
            workouts: workoutCount,
            meals: mealCount,
          },
          utility_bridge: {
            referrals: referralStats._count || 0,
            referral_points: referralStats._sum.reward_points || 0,
            ad_views: adViewStats._count || 0,
            ad_view_points: adViewStats._sum.reward_points || 0,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard stats',
      });
    }
  },

  // --- User Management ---
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        orderBy: { created_at: 'desc' },
        include: {
          submissions: {
            select: {
              id: true,
              status: true,
              created_at: true,
            },
          },
        },
      });

      res.json({
        success: true,
        users: users,
        count: users.length,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch users' 
      });
    }
  },

  // --- Reviewer Management ---
  async addReviewer(req: Request, res: Response): Promise<void> {
    const { wallet } = req.body;
    if (!wallet) {
      res.status(400).json({ error: 'Wallet address is required' });
      return;
    }
    try {
      const reviewer = await prisma.reviewerWallet.create({
        data: { wallet: wallet.toLowerCase() },
      });
      
      await AuditService.log({
        action: 'REVIEWER_ADDED',
        entity_type: 'reviewer',
        entity_id: reviewer.wallet,
        admin_user: 'admin', // TODO: Get from JWT token
        new_data: reviewer,
      });

      res.status(201).json(reviewer);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add reviewer' });
    }
  },

  async listReviewers(req: Request, res: Response): Promise<void> {
    try {
      const reviewers = await prisma.reviewerWallet.findMany();
      res.status(200).json(reviewers);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch reviewers' });
    }
  },

  async toggleReviewerStatus(req: Request, res: Response): Promise<void> {
    const { wallet, enabled } = req.body;
    if (!wallet || typeof enabled !== 'boolean') {
      res.status(400).json({ error: 'Wallet and enabled status are required' });
      return;
    }
    try {
      const reviewer = await prisma.reviewerWallet.update({
        where: { wallet },
        data: { enabled },
      });
      res.status(200).json(reviewer);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update reviewer' });
    }
  },

  // --- Submission & Payout Viewing ---
  async getSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const submissions = await prisma.submission.findMany({ 
        include: { 
          reviews: true, 
          assignments: true,
          user: { select: { wallet: true, handle: true } }
        } 
      });
      res.status(200).json(submissions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  },

  async getCommissions(req: Request, res: Response): Promise<void> {
    try {
      const commissions = await prisma.commission.findMany({ 
        where: { payout_id: null },
        orderBy: { earned_at: 'desc' }
      });
      res.status(200).json(commissions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch commissions' });
    }
  },

  async createPayout(req: Request, res: Response): Promise<void> {
    const { reviewer_wallet, commission_ids, tx_hash } = req.body;
    try {
      const commissions = await prisma.commission.findMany({ 
        where: { 
          id: { in: commission_ids }, 
          reviewer_wallet,
          payout_id: null 
        } 
      });
      
      if (commissions.length === 0) {
        res.status(400).json({ error: 'No valid commissions found' });
        return;
      }

      const totalAmount = commissions.reduce((sum, c) => sum + c.amount_usdt, 0);

      const payout = await prisma.$transaction(async (tx) => {
        const newPayout = await tx.payout.create({
          data: {
            reviewer_wallet,
            amount_usdt: totalAmount,
            tx_hash,
            status: 'PAID',
            period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
            period_end: new Date(),
          },
        });

        await tx.commission.updateMany({
          where: { id: { in: commission_ids } },
          data: { payout_id: newPayout.id },
        });

        return newPayout;
      });

      res.status(201).json(payout);
    } catch (error) {
      console.error('Failed to create payout:', error);
      res.status(500).json({ error: 'Failed to create payout' });
    }
  },

  async suspendReviewer(req: Request, res: Response): Promise<void> {
    const { wallet, days = 7 } = req.body;
    if (!wallet) {
      res.status(400).json({ error: 'Wallet address is required' });
      return;
    }

    try {
      const suspendUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      const oldReviewer = await prisma.reviewerWallet.findUnique({ where: { wallet } });
      
      const reviewer = await prisma.reviewerWallet.update({
        where: { wallet: wallet.toLowerCase() },
        data: { 
          enabled: false,
          suspended_until: suspendUntil,
        },
      });

      await AuditService.log({
        action: 'REVIEWER_SUSPENDED',
        entity_type: 'reviewer',
        entity_id: reviewer.wallet,
        admin_user: 'admin',
        old_data: oldReviewer,
        new_data: reviewer,
      });

      res.status(200).json(reviewer);
    } catch (error) {
      res.status(500).json({ error: 'Failed to suspend reviewer' });
    }
  },

  async assignSubmissionReviewers(req: Request, res: Response): Promise<void> {
    const { submission_id } = req.body;
    
    try {
      const submission = await prisma.submission.findUnique({ 
        where: { id: submission_id },
        include: { user: true }
      });
      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      // Get enabled reviewers who are not suspended
      const now = new Date();
      const enabledReviewers = await prisma.reviewerWallet.findMany({ 
        where: { 
          enabled: true,
          OR: [
            { suspended_until: null },
            { suspended_until: { lt: now } }
          ]
        } 
      });

      if (enabledReviewers.length < 5) {
        res.status(400).json({ error: 'Not enough enabled reviewers' });
        return;
      }

      // Filter out reviewers who reviewed this user in the last week
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentAssignments = await prisma.reviewAssignment.findMany({
        where: {
          assigned_at: { gte: oneWeekAgo },
          submission: { user_id: submission.user_id }
        },
        select: { reviewer_wallet: true }
      });

      const excludedReviewers = new Set(recentAssignments.map(a => a.reviewer_wallet));
      const availableReviewers = enabledReviewers.filter(r => !excludedReviewers.has(r.wallet));

      const selectedReviewers = (availableReviewers.length >= 5 ? availableReviewers : enabledReviewers)
        .sort(() => 0.5 - Math.random())
        .slice(0, 5);

      const assignments = await Promise.all(
        selectedReviewers.map(reviewer =>
          prisma.reviewAssignment.create({
            data: {
              submission_id,
              reviewer_wallet: reviewer.wallet,
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
          })
        )
      );

      await AuditService.log({
        action: 'REVIEWERS_ASSIGNED',
        entity_type: 'submission',
        entity_id: submission_id,
        admin_user: 'admin',
        new_data: { assignments: assignments.map(a => a.reviewer_wallet) },
      });

      res.status(201).json({ assignments });
    } catch (error) {
      console.error('Failed to assign reviewers:', error);
      res.status(500).json({ error: 'Failed to assign reviewers' });
    }
  },

  async closeSubmission(req: Request, res: Response): Promise<void> {
    const { submission_id } = req.body;

    try {
      const submission = await prisma.submission.findUnique({
        where: { id: submission_id },
        include: { reviews: true }
      });

      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      if (submission.status !== 'PENDING') {
        res.status(400).json({ error: 'Submission already closed' });
        return;
      }

      const reviews = submission.reviews;
      const approvals = reviews.filter(r => r.vote === 'APPROVE').length;
      const rejections = reviews.filter(r => r.vote === 'REJECT').length;

      let finalStatus: 'APPROVED' | 'REJECTED';
      if (approvals >= 3) {
        finalStatus = 'APPROVED';
      } else if (rejections >= 3) {
        finalStatus = 'REJECTED';
      } else {
        res.status(400).json({ error: 'Insufficient votes for closure' });
        return;
      }

      const updatedSubmission = await prisma.submission.update({
        where: { id: submission_id },
        data: {
          status: finalStatus,
          closed_at: new Date(),
        },
      });

      // Award commissions to reviewers
      await Promise.all(
        reviews.map(review =>
          prisma.commission.create({
            data: {
              reviewer_wallet: review.reviewer_wallet,
              submission_id: submission_id,
              amount_usdt: 0.005, // $0.005 USDT per vote
            },
          })
        )
      );

      await AuditService.log({
        action: 'SUBMISSION_CLOSED',
        entity_type: 'submission',
        entity_id: submission_id,
        admin_user: 'admin',
        old_data: { status: 'PENDING' },
        new_data: { status: finalStatus, closed_at: updatedSubmission.closed_at },
      });

      res.status(200).json(updatedSubmission);
    } catch (error) {
      console.error('Failed to close submission:', error);
      res.status(500).json({ error: 'Failed to close submission' });
    }
  },

  async previewCommissions(req: Request, res: Response): Promise<void> {
    const { period } = req.query as { period?: string };
    
    try {
      let startDate: Date;
      let endDate: Date;

      if (period) {
        // Parse YYYY-WW format
        const [year, week] = period.split('-');
        const yearNum = parseInt(year);
        const weekNum = parseInt(week);
        
        // Calculate start of week (Monday)
        const jan1 = new Date(yearNum, 0, 1);
        const daysToAdd = (weekNum - 1) * 7;
        startDate = new Date(jan1.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else {
        // Default to current week
        const now = new Date();
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate = new Date(now.getTime() - daysToMonday * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      }

      const commissions = await prisma.commission.findMany({
        where: {
          earned_at: {
            gte: startDate,
            lt: endDate,
          },
          payout_id: null, // Only unpaid commissions
        },
        orderBy: { reviewer_wallet: 'asc' },
      });

      // Group by reviewer
      const grouped = commissions.reduce((acc, commission) => {
        if (!acc[commission.reviewer_wallet]) {
          acc[commission.reviewer_wallet] = {
            reviewer_wallet: commission.reviewer_wallet,
            total_amount: 0,
            commission_count: 0,
            commission_ids: [],
          };
        }
        acc[commission.reviewer_wallet].total_amount += commission.amount_usdt;
        acc[commission.reviewer_wallet].commission_count += 1;
        acc[commission.reviewer_wallet].commission_ids.push(commission.id);
        return acc;
      }, {} as Record<string, any>);

      // Filter reviewers with balance >= $5
      const eligiblePayouts = Object.values(grouped).filter((g: any) => g.total_amount >= 5);

      res.status(200).json({
        period: period || 'current-week',
        start_date: startDate,
        end_date: endDate,
        total_commissions: commissions.length,
        total_amount: commissions.reduce((sum, c) => sum + c.amount_usdt, 0),
        eligible_payouts: eligiblePayouts,
        all_commissions: Object.values(grouped),
      });
    } catch (error) {
      console.error('Failed to preview commissions:', error);
      res.status(500).json({ error: 'Failed to preview commissions' });
    }
  },

  async markCommissionsPaid(req: Request, res: Response): Promise<void> {
    const { commission_ids, tx_hash, reviewer_wallet } = req.body;

    if (!commission_ids || !Array.isArray(commission_ids) || !tx_hash) {
      res.status(400).json({ error: 'commission_ids array and tx_hash are required' });
      return;
    }

    try {
      // Verify all commissions belong to the same reviewer and are unpaid
      const commissions = await prisma.commission.findMany({
        where: {
          id: { in: commission_ids },
          ...(reviewer_wallet && { reviewer_wallet }),
          payout_id: null,
        },
      });

      if (commissions.length !== commission_ids.length) {
        res.status(400).json({ error: 'Some commissions not found or already paid' });
        return;
      }

      const totalAmount = commissions.reduce((sum, c) => sum + c.amount_usdt, 0);
      const walletToUse = reviewer_wallet || commissions[0].reviewer_wallet;

      // Create payout record and link commissions
      const payout = await prisma.$transaction(async (tx) => {
        const newPayout = await tx.payout.create({
          data: {
            reviewer_wallet: walletToUse,
            amount_usdt: totalAmount,
            tx_hash,
            status: 'PAID',
            period_start: new Date(Math.min(...commissions.map(c => c.earned_at.getTime()))),
            period_end: new Date(Math.max(...commissions.map(c => c.earned_at.getTime()))),
          },
        });

        await tx.commission.updateMany({
          where: { id: { in: commission_ids } },
          data: { payout_id: newPayout.id },
        });

        return newPayout;
      });

      await AuditService.log({
        action: 'COMMISSIONS_MARKED_PAID',
        entity_type: 'payout',
        entity_id: payout.id,
        admin_user: 'admin',
        new_data: { 
          payout_id: payout.id,
          commission_ids,
          tx_hash,
          amount: totalAmount,
        },
      });

      res.status(200).json({ 
        success: true, 
        payout,
        commissions_count: commission_ids.length,
        total_amount: totalAmount,
      });
    } catch (error) {
      console.error('Failed to mark commissions as paid:', error);
      res.status(500).json({ error: 'Failed to mark commissions as paid' });
    }
  },

  // --- Clear All Users (MVP Only) ---
  async clearAllUsers(req: Request, res: Response): Promise<void> {
    try {
      // Delete all user-related data
      await prisma.warmupLog.deleteMany({});
      await prisma.workoutLog.deleteMany({});
      await prisma.mealLog.deleteMany({});
      await prisma.referral.deleteMany({});
      await prisma.adView.deleteMany({});
      await prisma.review.deleteMany({});
      await prisma.reviewAssignment.deleteMany({});
      await prisma.submission.deleteMany({});
      await prisma.payment.deleteMany({});
      await prisma.user.deleteMany({});

      // Log audit (if AuditService is available)
      // AuditService.log('CLEAR_ALL_USERS', 'admin', 'All users cleared for MVP reset');

      res.status(200).json({
        success: true,
        message: 'All users and related data cleared successfully',
      });
    } catch (error) {
      console.error('Failed to clear users:', error);
      res.status(500).json({ error: 'Failed to clear users' });
    }
  },
};

export default adminController;
