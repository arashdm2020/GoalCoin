import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
// import { AuditService } from '../services/auditService'; // Disabled until audit table is ready

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

      // TODO: Add audit logging when audit table is ready
      console.log('Reviewer added:', { userId: user.id, reviewerId: reviewer.id });

      res.status(201).json({ success: true, data: reviewer });
    } catch (error) {
      console.error('Failed to add reviewer:', error);
      res.status(500).json({ error: 'Failed to add reviewer' });
    }
  },

  async listReviewers(req: Request, res: Response): Promise<void> {
    const { status, accuracyMin, accuracyMax, date, country, page = '1', limit = '25' } = req.query;

    try {
      const where: any = {};
      // Don't filter by status if it causes type mismatch issues
      // The database column might be TEXT instead of ENUM
      if (status && status !== 'All') {
        // Cast to proper type to avoid PostgreSQL type mismatch
        where.status = status as any;
      }
      // Accuracy and date filtering will be more complex and added later

      console.log('Fetching reviewers with filter:', { status, country, page, limit });

      // Use raw query to avoid type mismatch with ReviewerStatus enum
      let reviewers: any[];
      if (status && status !== 'All') {
        reviewers = await prisma.$queryRaw`
          SELECT r.*, 
                 json_build_object('wallet', u.wallet, 'handle', u.handle, 'country_code', u.country_code) as user
          FROM reviewers r
          JOIN users u ON r.user_id = u.id
          WHERE r.status::text = ${status}
          ORDER BY r.created_at DESC
        ` as any[];
      } else {
        reviewers = await prisma.reviewer.findMany({
          where: {},
          include: {
            user: { select: { wallet: true, handle: true, country_code: true } },
          },
          orderBy: { created_at: 'desc' },
        });
      }

      console.log(`Found ${reviewers.length} reviewers`);

      // Filter by country if specified
      let filteredReviewers = reviewers;
      if (country && country !== 'All') {
        filteredReviewers = reviewers.filter(r => r.user?.country_code === country);
      }

      const reviewerWallets = filteredReviewers
        .map(r => r.user.wallet)
        .filter((w): w is string => w !== null && w !== undefined);

      console.log(`Processing ${reviewerWallets.length} reviewer wallets`);

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

      console.log(`Found ${reviews.length} reviews`);

      const reviewsByWallet = reviews.reduce((acc, review) => {
        const wallet = review.reviewer_wallet;
        if (!acc[wallet]) {
          acc[wallet] = [];
        }
        acc[wallet].push(review);
        return acc;
      }, {} as Record<string, typeof reviews>);

      const reviewersWithAccuracy = filteredReviewers.map(reviewer => {
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

      // Apply pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedData = filteredData.slice(startIndex, endIndex);

      res.status(200).json({ 
        success: true, 
        data: paginatedData,
        total: filteredData.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(filteredData.length / limitNum)
      });
    } catch (error) {
      console.error('Failed to fetch reviewers:', error);
        console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        query: { status, accuracyMin, accuracyMax, date, country, page, limit }
      });
      res.status(500).json({ 
        error: 'Failed to fetch reviewers',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      });
    }
  },

  async getAvailableCountries(req: Request, res: Response): Promise<void> {
    try {
      // Get all unique country codes from users table
      const countries = await prisma.user.findMany({
        where: {
          country_code: {
            not: null
          }
        },
        select: {
          country_code: true
        },
        distinct: ['country_code']
      });

      // Country code to full name mapping
      const countryNames: Record<string, string> = {
        'US': 'United States',
        'CN': 'China',
        'JP': 'Japan',
        'DE': 'Germany',
        'IN': 'India',
        'GB': 'United Kingdom',
        'FR': 'France',
        'IT': 'Italy',
        'BR': 'Brazil',
        'CA': 'Canada',
        'KR': 'South Korea',
        'RU': 'Russia',
        'AU': 'Australia',
        'ES': 'Spain',
        'MX': 'Mexico',
        'ID': 'Indonesia',
        'NL': 'Netherlands',
        'SA': 'Saudi Arabia',
        'TR': 'Turkey',
        'CH': 'Switzerland',
        'TW': 'Taiwan',
        'BE': 'Belgium',
        'IE': 'Ireland',
        'IL': 'Israel',
        'NO': 'Norway',
        'AE': 'United Arab Emirates',
        'EG': 'Egypt',
        'NG': 'Nigeria',
        'ZA': 'South Africa',
        'AR': 'Argentina',
        'TH': 'Thailand',
        'SG': 'Singapore',
        'MY': 'Malaysia',
        'PH': 'Philippines',
        'CL': 'Chile',
        'PK': 'Pakistan',
        'BD': 'Bangladesh',
        'VN': 'Vietnam',
        'CO': 'Colombia',
        'PL': 'Poland',
        'SE': 'Sweden',
        'AT': 'Austria',
        'DK': 'Denmark',
        'FI': 'Finland',
        'CZ': 'Czech Republic',
        'PT': 'Portugal',
        'GR': 'Greece',
        'NZ': 'New Zealand',
        'HU': 'Hungary',
        'RO': 'Romania'
      };

      const countryList = countries
        .map(c => c.country_code)
        .filter((code): code is string => code !== null && code !== undefined)
        .map(code => ({
          code: code,
          name: countryNames[code] || code
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      res.status(200).json({ success: true, data: countryList });
    } catch (error) {
      console.error('Failed to fetch countries:', error);
      res.status(500).json({ 
        error: 'Failed to fetch countries',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      });
    }
  },

  async toggleReviewerStatus(req: Request, res: Response): Promise<void> {
    const { reviewerId, status } = req.body;
    console.log('Toggle reviewer status request:', { reviewerId, status, body: req.body });
    
    if (!reviewerId || !status || !['ACTIVE', 'SUSPENDED'].includes(status)) {
      res.status(400).json({ error: 'Reviewer ID and a valid status (ACTIVE/SUSPENDED) are required' });
      return;
    }

    try {
      // First check if reviewer exists
      const existingReviewer = await prisma.reviewer.findUnique({
        where: { id: reviewerId },
      });

      if (!existingReviewer) {
        res.status(404).json({ error: 'Reviewer not found' });
        return;
      }

      const updatedReviewer = await prisma.reviewer.update({
        where: { id: reviewerId },
        data: { status: status },
      });

      // TODO: Add audit logging when audit table is ready
      console.log('Reviewer status changed:', { reviewerId, status, updatedReviewer });

      res.status(200).json({ success: true, data: updatedReviewer });
    } catch (error) {
      console.error('Failed to update reviewer status:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        reviewerId,
        status
      });
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

      // TODO: Add audit logging when audit table is ready
      console.log('Reviewer strikes reset:', { reviewerId });

      res.status(200).json({ success: true, data: updatedReviewer });
    } catch (error) {
      console.error('Failed to reset strikes:', error);
      res.status(500).json({ error: 'Failed to reset strikes' });
    }
  },

  async removeReviewer(req: Request, res: Response): Promise<void> {
    const { reviewerId } = req.body;
    if (!reviewerId) {
      res.status(400).json({ error: 'Reviewer ID is required' });
      return;
    }

    try {
      // First check if reviewer exists
      const reviewer = await prisma.reviewer.findUnique({
        where: { id: reviewerId },
        include: { user: { select: { wallet: true } } },
      });

      if (!reviewer) {
        res.status(404).json({ error: 'Reviewer not found' });
        return;
      }

      // Use transaction to handle foreign key constraints
      await prisma.$transaction(async (tx) => {
        // Delete related audit logs first using raw SQL to avoid Prisma model issues
        try {
          await tx.$executeRaw`DELETE FROM audit_logs WHERE reviewer_id = ${reviewerId}`;
          console.log('Deleted audit logs for reviewer:', reviewerId);
        } catch (auditError) {
          console.log('No audit logs to delete or table does not exist:', auditError);
        }

        // Delete related review assignments
        if (reviewer.user.wallet) {
          await tx.reviewAssignment.deleteMany({
            where: { reviewer_wallet: reviewer.user.wallet }
          });

          // Delete related reviews
          await tx.review.deleteMany({
            where: { reviewer_wallet: reviewer.user.wallet }
          });

          // Delete related commissions
          await tx.commission.deleteMany({
            where: { reviewer_wallet: reviewer.user.wallet }
          });
        }

        // Finally delete the reviewer
        await tx.reviewer.delete({
          where: { id: reviewerId },
        });
      });

      // TODO: Add audit logging when audit table is ready
      console.log('Reviewer removed:', { reviewerId, wallet: reviewer.user.wallet });

      res.status(200).json({ 
        success: true, 
        message: 'Reviewer removed successfully' 
      });
    } catch (error) {
      console.error('Failed to remove reviewer:', error);
      res.status(500).json({ error: 'Failed to remove reviewer' });
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

      // Try to create admin log, but don't fail if table doesn't exist
      try {
        await prisma.adminLog.create({
          data: {
            admin_user: 'admin', // TODO: Get from JWT
            action: `FORCE_${status}`,
            target_id: submissionId,
            reason: reason || 'No reason provided',
          },
        });
      } catch (logError) {
        console.warn('Failed to create admin log (table may not exist):', logError instanceof Error ? logError.message : 'Unknown error');
      }

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
    const { type = 'global', country, sport, page = '1', limit = '25' } = req.query;

    try {
      const where: any = {};
      if (type === 'country' && country) {
        where.country_code = country as string;
      }
      if (country && country !== '') {
        where.country_code = country as string;
      }
      // Sport-specific leaderboard logic would be more complex

      // Get total count for pagination
      const totalCount = await prisma.user.count({ where });

      // Apply pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const users = await prisma.user.findMany({
        where,
        orderBy: { goal_points: 'desc' },
        skip,
        take: limitNum,
        select: {
          id: true,
          handle: true,
          wallet: true,
          country_code: true,
          goal_points: true,
          xp_points: true,
        },
      });

      res.status(200).json({ 
        success: true, 
        data: users,
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum)
      });
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
  async listSubmissions(req: Request, res: Response): Promise<void> {
    const { status, country, date, page = '1', limit = '25' } = req.query;

    try {
      const where: any = {};

      if (status && status !== 'All') {
        where.status = status;
      }
      if (country && country !== 'All') {
        where.user = { country_code: country as string };
      }
      if (date) {
        const startDate = new Date(date as string);
        const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        where.created_at = { gte: startDate, lt: endDate };
      }

      // Parse pagination parameters
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      // Get total count for pagination
      const total = await prisma.submission.count({ where });

      const submissions = await prisma.submission.findMany({
        where,
        include: {
          reviews: true,
          assignments: true,
          user: { select: { wallet: true, handle: true, country_code: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limitNum,
      });

      res.status(200).json({ 
        success: true, 
        data: submissions,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      });
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({ 
        error: 'Failed to fetch submissions',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      });
    }
  },

  async getSubmissionStatusCounts(req: Request, res: Response): Promise<void> {
    try {
      const [pending, approved, rejected, total] = await Promise.all([
        prisma.submission.count({ where: { status: 'PENDING' } }),
        prisma.submission.count({ where: { status: 'APPROVED' } }),
        prisma.submission.count({ where: { status: 'REJECTED' } }),
        prisma.submission.count(),
      ]);

      res.status(200).json({
        success: true,
        data: {
          pending,
          approved,
          rejected,
          total,
        },
      });
    } catch (error) {
      console.error('Failed to fetch submission status counts:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({ 
        error: 'Failed to fetch submission status counts',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      });
    }
  },

  async getCommissions(req: Request, res: Response): Promise<void> {
    const { status, date, page = '1', limit = '25' } = req.query;
    
    try {
      const where: any = {};
      
      // Filter by status (paid/unpaid)
      if (status === 'paid') {
        where.payout_id = { not: null };
      } else if (status === 'unpaid') {
        where.payout_id = null;
      }
      
      // Filter by date
      if (date) {
        const filterDate = new Date(date as string);
        where.earned_at = {
          gte: filterDate,
          lt: new Date(filterDate.getTime() + 24 * 60 * 60 * 1000)
        };
      }
      
      // Get total count for pagination
      const totalCount = await prisma.commission.count({ where });
      
      // Apply pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;
      
      const commissions = await prisma.commission.findMany({ 
        where,
        orderBy: { earned_at: 'desc' },
        skip,
        take: limitNum
      });
      
      res.status(200).json({ 
        success: true, 
        data: commissions,
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum)
      });
    } catch (error) {
      console.error('Failed to fetch commissions:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch commissions' 
      });
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

      console.log('Reviewer suspended:', { reviewerId: reviewer.user_id, status: 'SUSPENDED' });

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

      // Use raw query to avoid type mismatch with ReviewerStatus enum
      const activeReviewers: any[] = await prisma.$queryRaw`
        SELECT r.*, 
               json_build_object('wallet', u.wallet, 'handle', u.handle) as user
        FROM reviewers r
        JOIN users u ON r.user_id = u.id
        WHERE r.status::text = 'ACTIVE'
      `;

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

      // TODO: Add audit logging when audit table is ready
      console.log('Reviewers assigned:', { submissionId: submission_id, assignments: assignments.map(a => a.reviewer_wallet) });

      res.status(201).json({ success: true, data: assignments });
    } catch (error) {
      console.error('Failed to assign reviewers:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({ 
        error: 'Failed to assign reviewers',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      });
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
              // TODO: Add audit logging when audit table is ready
              console.log('Reviewer auto-suspended:', { reviewerId: reviewerUser.reviewer.id, reason: `Reached ${STRIKE_THRESHOLD} strikes.` });
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

      // TODO: Add audit logging when audit table is ready
      console.log('Submission closed:', { submissionId: submission_id, status: finalStatus });

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

      // TODO: Add audit logging when audit table is ready
      console.log('Commissions marked as paid:', { payoutId: payout.id, commissionIds: commission_ids, amount: totalAmount });

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

  // --- User Details ---
  async getUserDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          submissions: {
            select: {
              id: true,
              status: true,
              created_at: true,
              week_no: true,
            },
          },
          warmup_logs: {
            select: {
              id: true,
              completed_at: true,
              xp_earned: true,
            },
          },
          workout_logs: {
            select: {
              id: true,
              completed_at: true,
              workout_type: true,
              duration_min: true,
            },
          },
          meal_logs: {
            select: {
              id: true,
              completed_at: true,
              meal_type: true,
              calories: true,
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      res.status(500).json({ error: 'Failed to fetch user details' });
    }
  },

  async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Get submission stats
      const submissionStats = await prisma.submission.groupBy({
        by: ['status'],
        where: { user_id: id },
        _count: true,
      });

      const totalSubmissions = submissionStats.reduce((sum, stat) => sum + stat._count, 0);
      const approvedSubmissions = submissionStats.find(s => s.status === 'APPROVED')?._count || 0;
      const pendingSubmissions = submissionStats.find(s => s.status === 'PENDING')?._count || 0;
      const rejectedSubmissions = submissionStats.find(s => s.status === 'REJECTED')?._count || 0;
      const successRate = totalSubmissions > 0 ? Math.round((approvedSubmissions / totalSubmissions) * 100) : 0;

      // Get activity counts
      const [totalWarmups, totalWorkouts, totalMeals] = await Promise.all([
        prisma.warmupLog.count({ where: { user_id: id } }),
        prisma.workoutLog.count({ where: { user_id: id } }),
        prisma.mealLog.count({ where: { user_id: id } }),
      ]);

      res.status(200).json({
        success: true,
        stats: {
          totalSubmissions,
          approvedSubmissions,
          pendingSubmissions,
          rejectedSubmissions,
          successRate,
          totalWarmups,
          totalWorkouts,
          totalMeals,
        },
      });
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      res.status(500).json({ error: 'Failed to fetch user stats' });
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
