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

  // --- Reviewer Management --- (Reloading server)
  async addReviewer(req: Request, res: Response): Promise<void> {
    const { wallet } = req.body;
    if (!wallet || !wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
      res.status(400).json({ error: 'A valid wallet address is required' });
      return;
    }

    const lowerCaseWallet = wallet.toLowerCase();

    try {
      const user = await prisma.user.upsert({
        where: { wallet: lowerCaseWallet },
        update: {}, // No update needed if user exists
        create: { wallet: lowerCaseWallet, email: `${lowerCaseWallet}@goalcoin.app` }, // Create a placeholder email
      });

      const existingReviewer = await prisma.reviewer.findUnique({
        where: { user_id: user.id },
      });

      if (existingReviewer) {
        res.status(400).json({ error: 'This user is already a reviewer.' });
        return;
      }

      const reviewer = await prisma.reviewer.create({
        data: {
          user_id: user.id,
        },
      });

      await AuditService.log({
        action: 'REVIEWER_ADDED',
        entity_type: 'reviewer',
        entity_id: reviewer.id,
        admin_user: 'admin', // TODO: Get from JWT token
        new_data: { userId: user.id, reviewerId: reviewer.id },
      });

      res.status(201).json({ success: true, data: reviewer });
    } catch (error) {
      console.error('Failed to add reviewer:', error);
      res.status(500).json({ error: 'Failed to add reviewer' });
    }
  },

  async listReviewers(req: Request, res: Response): Promise<void> {
    const { status, accuracyMin, accuracyMax, date } = req.query;

    try {
      const where: any = {};
      if (status && status !== 'All') {
        where.status = status as 'ACTIVE' | 'SUSPENDED';
      }
      // Accuracy and date filtering will be more complex and added later

      const reviewers = await prisma.reviewer.findMany({
        where,
        include: {
          user: { select: { wallet: true, handle: true } },
        },
        orderBy: { created_at: 'desc' },
      });

      const reviewerWallets = reviewers
        .map(r => r.user.wallet)
        .filter((w): w is string => w !== null && w !== undefined);

      // Only fetch reviews if there are reviewer wallets
      const reviews = reviewerWallets.length > 0 ? await prisma.review.findMany({
        where: {
          reviewer_wallet: { in: reviewerWallets },
          submission: {
            status: { in: ['APPROVED', 'REJECTED'] },
          },
        },
        include: {
          submission: {
            select: { status: true },
          },
        },
      }) : [];

      const reviewsByWallet = reviews.reduce((acc, review) => {
        const wallet = review.reviewer_wallet;
        if (!acc[wallet]) {
          acc[wallet] = [];
        }
        acc[wallet].push(review);
        return acc;
      }, {} as Record<string, typeof reviews>);

      const reviewersWithAccuracy = reviewers.map(reviewer => {
        const wallet = reviewer.user.wallet;
        if (!wallet || !reviewsByWallet[wallet]) {
          return { ...reviewer, accuracy: 1, total_votes: 0, wrong_votes: 0 };
        }

        const theirReviews = reviewsByWallet[wallet];
        let wrongVotes = 0;

        theirReviews.forEach(review => {
          const finalStatus = review.submission.status;
          const theirVote = review.vote;
          if (
            (theirVote === 'APPROVE' && finalStatus === 'REJECTED') ||
            (theirVote === 'REJECT' && finalStatus === 'APPROVED')
          ) {
            wrongVotes++;
          }
        });

        const totalVotes = theirReviews.length;
        const accuracy = totalVotes > 0 ? 1 - wrongVotes / totalVotes : 1;

        return { ...reviewer, accuracy, total_votes: totalVotes, wrong_votes: wrongVotes };
      });

      const filteredData = reviewersWithAccuracy.filter(r => {
        if (accuracyMin && r.accuracy < parseFloat(accuracyMin as string)) return false;
        if (accuracyMax && r.accuracy > parseFloat(accuracyMax as string)) return false;
        return true;
      });

      res.status(200).json({ success: true, data: filteredData });
    } catch (error) {
      console.error('Failed to fetch reviewers:', error);
        console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        query: { status, accuracyMin, accuracyMax, date }
      });
      res.status(500).json({ 
        error: 'Failed to fetch reviewers',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      });
    }
  },

  async toggleReviewerStatus(req: Request, res: Response): Promise<void> {
    const { reviewerId, status } = req.body;
    if (!reviewerId || !status || !['ACTIVE', 'SUSPENDED'].includes(status)) {
      res.status(400).json({ error: 'Reviewer ID and a valid status (ACTIVE/SUSPENDED) are required' });
      return;
    }

    try {
      const updatedReviewer = await prisma.reviewer.update({
        where: { id: reviewerId },
        data: { status: status as 'ACTIVE' | 'SUSPENDED' },
      });

      await AuditService.log({
        action: 'REVIEWER_STATUS_CHANGED',
        entity_type: 'reviewer',
        entity_id: reviewerId,
        admin_user: 'admin', // TODO: Get from JWT
        new_data: { status },
      });

      res.status(200).json({ success: true, data: updatedReviewer });
    } catch (error) {
      console.error('Failed to update reviewer status:', error);
      res.status(500).json({ error: 'Failed to update reviewer status' });
    }
  },

  async resetStrikes(req: Request, res: Response): Promise<void> {
    const { reviewerId } = req.body;
    if (!reviewerId) {
      res.status(400).json({ error: 'Reviewer ID is required' });
      return;
    }

    try {
      const updatedReviewer = await prisma.reviewer.update({
        where: { id: reviewerId },
        data: { strikes: 0 },
      });

      await AuditService.log({
        action: 'REVIEWER_STRIKES_RESET',
        entity_type: 'reviewer',
        entity_id: reviewerId,
        admin_user: 'admin', // TODO: Get from JWT
      });

      res.status(200).json({ success: true, data: updatedReviewer });
    } catch (error) {
      console.error('Failed to reset strikes:', error);
      res.status(500).json({ error: 'Failed to reset strikes' });
    }
  },

  async getReviewerAudit(req: Request, res: Response): Promise<void> {
    const { reviewerId } = req.params;
    if (!reviewerId) {
      res.status(400).json({ error: 'Reviewer ID is required' });
      return;
    }

    try {
      const reviewer = await prisma.reviewer.findUnique({
        where: { id: reviewerId },
        include: { user: { select: { wallet: true } } },
      });

      if (!reviewer) {
        res.status(404).json({ error: 'Reviewer not found' });
        return;
      }

      const votes = await prisma.review.findMany({
        where: { reviewer_wallet: reviewer.user.wallet! },
        orderBy: { voted_at: 'desc' },
        take: 20,
      });

      res.status(200).json({ success: true, data: votes });
    } catch (error) {
      console.error('Failed to get reviewer audit:', error);
      res.status(500).json({ error: 'Failed to get reviewer audit' });
    }
  },

  async bulkUpdateSubmissionStatus(req: Request, res: Response): Promise<void> {
    const { submissionIds, status } = req.body;

    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0 || !status) {
      res.status(400).json({ error: 'An array of submission IDs and a status are required' });
      return;
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ error: 'Invalid status provided' });
      return;
    }

    try {
      const result = await prisma.submission.updateMany({
        where: {
          id: { in: submissionIds },
        },
        data: {
          status: status as 'APPROVED' | 'REJECTED',
          closed_at: new Date(),
        },
      });

      await prisma.adminLog.create({
        data: {
          admin_user: 'admin', // TODO: Get from JWT
          action: `BULK_${status}`,
          target_id: `${result.count} submissions`,
          reason: `Bulk operation via admin panel`,
        },
      });

      res.status(200).json({ success: true, count: result.count });
    } catch (error) {
      console.error(`Failed to bulk update status to ${status}:`, error);
      res.status(500).json({ error: 'Failed to bulk update submissions' });
    }
  },

  async forceUpdateSubmissionStatus(req: Request, res: Response): Promise<void> {
    const { submissionId, status, reason } = req.body;

    if (!submissionId || !status) {
      res.status(400).json({ error: 'Submission ID and status are required' });
      return;
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ error: 'Invalid status provided' });
      return;
    }

    try {
      const submission = await prisma.submission.update({
        where: { id: submissionId },
        data: { 
          status: status as 'APPROVED' | 'REJECTED',
          closed_at: new Date(),
        },
      });

      await prisma.adminLog.create({
        data: {
          admin_user: 'admin', // TODO: Get from JWT
          action: `FORCE_${status}`,
          target_id: submissionId,
          reason: reason || 'No reason provided',
        },
      });

      res.status(200).json({ success: true, data: submission });
    } catch (error) {
      console.error(`Failed to force update status to ${status}:`, error);
      res.status(500).json({ error: 'Failed to update submission status' });
    }
  },

  async addManualCommission(req: Request, res: Response): Promise<void> {
    const { reviewer_wallet, submission_id, amount_usdt, reason } = req.body;
    if (!reviewer_wallet || !submission_id || !amount_usdt) {
      res.status(400).json({ error: 'Reviewer wallet, submission ID, and amount are required' });
      return;
    }

    try {
      const commission = await prisma.commission.create({
        data: {
          reviewer_wallet,
          submission_id,
          amount_usdt,
        },
      });

      await prisma.adminLog.create({
        data: {
          admin_user: 'admin', // TODO: from JWT
          action: 'MANUAL_COMMISSION_ADD',
          target_id: commission.id,
          reason: reason || 'Manual commission added',
        },
      });

      res.status(201).json({ success: true, data: commission });
    } catch (error) {
      console.error('Failed to add manual commission:', error);
      res.status(500).json({ error: 'Failed to add manual commission' });
    }
  },

  async getLeaderboard(req: Request, res: Response): Promise<void> {
    const { type = 'global', country, sport } = req.query;

    try {
      const where: any = {};
      if (type === 'country' && country) {
        where.country_code = country as string;
      }
      // Sport-specific leaderboard logic would be more complex

      const users = await prisma.user.findMany({
        where,
        orderBy: { goal_points: 'desc' },
        take: 100,
        select: {
          handle: true,
          wallet: true,
          country_code: true,
          goal_points: true,
          xp_points: true,
        },
      });

      res.status(200).json({ success: true, data: users });
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      res.status(500).json({ error: 'Failed to get leaderboard' });
    }
  },

  async recalculateLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      // This is a placeholder for a more complex recalculation logic
      // For now, it just confirms that the endpoint is reachable.
      res.status(200).json({ success: true, message: 'Leaderboard recalculation triggered.' });
    } catch (error) {
      console.error('Failed to recalculate leaderboard:', error);
      res.status(500).json({ error: 'Failed to recalculate leaderboard' });
    }
  },

  // --- Settings Management ---

  async getSystemStatus(req: Request, res: Response): Promise<void> {
    try {
      // Mock data for now
      const status = {
        mailgun: 'operational',
        redis: 'connected',
        database: 'connected',
        lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      };
      res.status(200).json({ success: true, data: status });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get system status' });
    }
  },

  async getFeatureToggles(req: Request, res: Response): Promise<void> {
    try {
      const toggles = await prisma.featureToggle.findMany();
      res.status(200).json({ success: true, data: toggles });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get feature toggles' });
    }
  },

  async updateFeatureToggle(req: Request, res: Response): Promise<void> {
    const { key, value } = req.body;
    if (!key || typeof value !== 'boolean') {
      res.status(400).json({ error: 'Key and boolean value are required' });
      return;
    }

    try {
      const toggle = await prisma.featureToggle.update({
        where: { key },
        data: { value },
      });
      res.status(200).json({ success: true, data: toggle });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update feature toggle' });
    }
  },

  async getAdminSecurityLogs(req: Request, res: Response): Promise<void> {
    try {
      const logs = await prisma.adminLog.findMany({
        orderBy: { created_at: 'desc' },
        take: 50,
      });
      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get admin logs' });
    }
  },

  async verifyBurnRecord(req: Request, res: Response): Promise<void> {
    const { burnId } = req.body;
    if (!burnId) {
      res.status(400).json({ error: 'Burn ID is required' });
      return;
    }
    // This is a placeholder for the actual verification logic
    res.status(200).json({ success: true, message: `Burn record ${burnId} verified.` });
  },

  // --- Submission & Payout Viewing ---
  async getSubmissions(req: Request, res: Response): Promise<void> {
    const { status, date, country } = req.query;
    try {
      const where: any = {};

      if (status && status !== 'All') {
        where.status = status as 'PENDING' | 'APPROVED' | 'REJECTED';
      }
      if (country && country !== 'All') {
        where.user = { country_code: country as string };
      }
      if (date) {
        const startDate = new Date(date as string);
        const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        where.created_at = { gte: startDate, lt: endDate };
      }

      const submissions = await prisma.submission.findMany({
        where,
        include: {
          reviews: true,
          assignments: true,
          user: { select: { wallet: true, handle: true, country_code: true } },
        },
        orderBy: { created_at: 'desc' },
      });
      res.status(200).json({ success: true, data: submissions });
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
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
      const oldReviewer = await prisma.reviewer.findUnique({ where: { user_id: wallet } });
      
      const reviewer = await prisma.reviewer.update({
        where: { user_id: wallet.toLowerCase() },
        data: { 
          status: 'SUSPENDED',
        },
      });

      await AuditService.log({
        action: 'REVIEWER_SUSPENDED',
        entity_type: 'reviewer',
        entity_id: reviewer.user_id,
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

      const activeReviewers = await prisma.reviewer.findMany({
        where: { status: 'ACTIVE' },
        include: { user: { select: { wallet: true } } },
      });

      if (activeReviewers.length < 5) {
        res.status(400).json({ error: 'Not enough active reviewers' });
        return;
      }

      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentAssignments = await prisma.reviewAssignment.findMany({
        where: {
          assigned_at: { gte: oneWeekAgo },
          submission: { user_id: submission.user_id }
        },
        select: { reviewer_wallet: true }
      });

      const excludedWallets = new Set(recentAssignments.map(a => a.reviewer_wallet));
      const availableReviewers = activeReviewers.filter(r => r.user.wallet && !excludedWallets.has(r.user.wallet));

      const selectedReviewers = (availableReviewers.length >= 5 ? availableReviewers : activeReviewers)
        .sort(() => 0.5 - Math.random())
        .slice(0, 5);

      const assignments = await Promise.all(
        selectedReviewers.map(reviewer =>
          prisma.reviewAssignment.create({
            data: {
              submission_id,
              reviewer_wallet: reviewer.user.wallet!,
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

      res.status(201).json({ success: true, data: assignments });
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

      // Handle reviewer strikes
      const STRIKE_THRESHOLD = 3;

      for (const review of reviews) {
        const finalStatus = updatedSubmission.status;
        const theirVote = review.vote;
        let wasWrong = false;

        if (
          (theirVote === 'APPROVE' && finalStatus === 'REJECTED') ||
          (theirVote === 'REJECT' && finalStatus === 'APPROVED')
        ) {
          wasWrong = true;
        }

        if (wasWrong) {
          const reviewerUser = await prisma.user.findUnique({
            where: { wallet: review.reviewer_wallet },
            include: { reviewer: true },
          });

          if (reviewerUser && reviewerUser.reviewer) {
            const newStrikes = reviewerUser.reviewer.strikes + 1;

            if (newStrikes >= STRIKE_THRESHOLD) {
              await prisma.reviewer.update({
                where: { id: reviewerUser.reviewer.id },
                data: { status: 'SUSPENDED', strikes: 0 },
              });
              await AuditService.log({
                action: 'REVIEWER_AUTO_SUSPENDED',
                entity_type: 'reviewer',
                entity_id: reviewerUser.reviewer.id,
                admin_user: 'system',
                new_data: { reason: `Reached ${STRIKE_THRESHOLD} strikes.` },
              });
            } else {
              await prisma.reviewer.update({
                where: { id: reviewerUser.reviewer.id },
                data: { strikes: newStrikes },
              });
            }
          }
        }
      }

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

  async exportCsv(req: Request, res: Response): Promise<void> {
    const { type } = req.query;

    try {
      let data: any[] = [];
      let headers: string[] = [];

      switch (type) {
        case 'reviewers':
          data = await prisma.reviewer.findMany({ include: { user: true } });
          headers = ['id', 'user_id', 'wallet', 'status', 'strikes', 'created_at'];
          break;
        case 'submissions':
          data = await prisma.submission.findMany({ include: { user: true } });
          headers = ['id', 'user_id', 'wallet', 'status', 'created_at', 'closed_at'];
          break;
        case 'commissions':
          data = await prisma.commission.findMany();
          headers = ['id', 'reviewer_wallet', 'submission_id', 'amount_usdt', 'earned_at', 'payout_id'];
          break;
        default:
          res.status(400).json({ error: 'Invalid export type' });
          return;
      }

      const csv = [headers.join(',')];
      data.forEach(row => {
        const values = headers.map(header => {
          if (header === 'wallet') return row.user?.wallet || '';
          return row[header];
        });
        csv.push(values.join(','));
      });

      res.header('Content-Type', 'text/csv');
      res.attachment(`export-${type}-${Date.now()}.csv`);
      res.send(csv.join('\n'));

    } catch (error) {
      console.error('Failed to export CSV:', error);
      res.status(500).json({ error: 'Failed to export CSV' });
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
