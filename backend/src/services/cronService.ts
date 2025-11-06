import { PrismaClient } from '@prisma/client';
import { AuditService } from './auditService';

const prisma = new PrismaClient();

export class CronService {
  // Reassign expired review assignments (run every hour)
  static async reassignExpiredAssignments() {
    try {
      const now = new Date();
      const expiredAssignments = await prisma.reviewAssignment.findMany({
        where: {
          expires_at: { lt: now },
          status: 'PENDING',
        },
        include: {
          submission: {
            include: { user: true }
          }
        }
      });

      console.log(`Found ${expiredAssignments.length} expired assignments to reassign`);

      for (const assignment of expiredAssignments) {
        // Mark current assignment as reassigned
        await prisma.reviewAssignment.update({
          where: { id: assignment.id },
          data: { status: 'REASSIGNED' },
        });

        // Check if submission still needs more reviewers
        const existingReviews = await prisma.review.count({
          where: { submission_id: assignment.submission_id }
        });

        if (existingReviews < 3) {
          // Get available reviewers (excluding those who already reviewed this submission)
          const existingReviewers = await prisma.review.findMany({
            where: { submission_id: assignment.submission_id },
            select: { reviewer_wallet: true }
          });

          const excludedWallets = existingReviewers.map(r => r.reviewer_wallet);

          // Also exclude reviewers who reviewed this user recently
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const recentAssignments = await prisma.reviewAssignment.findMany({
            where: {
              assigned_at: { gte: oneWeekAgo },
              submission: { user_id: assignment.submission.user_id }
            },
            select: { reviewer_wallet: true }
          });

          const recentReviewers = new Set(recentAssignments.map(a => a.reviewer_wallet));
          excludedWallets.forEach(wallet => recentReviewers.add(wallet));

          const availableReviewers = await prisma.reviewerWallet.findMany({
            where: {
              enabled: true,
              wallet: { notIn: Array.from(recentReviewers) },
              OR: [
                { suspended_until: null },
                { suspended_until: { lt: now } }
              ]
            },
            take: 2, // Assign 2 more reviewers
          });

          // Create new assignments
          for (const reviewer of availableReviewers) {
            await prisma.reviewAssignment.create({
              data: {
                submission_id: assignment.submission_id,
                reviewer_wallet: reviewer.wallet,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
              },
            });
          }

          await AuditService.log({
            action: 'ASSIGNMENT_REASSIGNED',
            entity_type: 'submission',
            entity_id: assignment.submission_id,
            new_data: {
              expired_reviewer: assignment.reviewer_wallet,
              new_reviewers: availableReviewers.map(r => r.wallet),
            },
          });
        }
      }

      return { reassigned: expiredAssignments.length };
    } catch (error) {
      console.error('Error in reassignExpiredAssignments:', error);
      throw error;
    }
  }

  // Compute 7-day accuracy and auto-suspend reviewers (run daily)
  static async computeAccuracyAndSuspend() {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Get all reviewers
      const reviewers = await prisma.reviewerWallet.findMany();

      for (const reviewer of reviewers) {
        // Get reviews from last 7 days
        const recentReviews = await prisma.review.findMany({
          where: {
            reviewer_wallet: reviewer.wallet,
            voted_at: { gte: sevenDaysAgo },
          },
          include: {
            submission: {
              select: { status: true }
            }
          }
        });

        // Only count reviews for closed submissions
        const closedReviews = recentReviews.filter(r => 
          r.submission.status === 'APPROVED' || r.submission.status === 'REJECTED'
        );

        if (closedReviews.length > 0) {
          const correctVotes = closedReviews.filter(review => {
            const finalStatus = review.submission.status;
            return (finalStatus === 'APPROVED' && review.vote === 'APPROVE') ||
                   (finalStatus === 'REJECTED' && review.vote === 'REJECT');
          }).length;

          const accuracy = (correctVotes / closedReviews.length) * 100;

          // Update reviewer accuracy
          const updateData: any = {
            accuracy_7d: accuracy,
            total_votes: reviewer.total_votes + closedReviews.length,
            wrong_votes: reviewer.wrong_votes + (closedReviews.length - correctVotes),
          };

          // Auto-suspend if accuracy < 85%
          if (accuracy < 85 && reviewer.enabled) {
            updateData.enabled = false;
            updateData.suspended_until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            await AuditService.log({
              action: 'REVIEWER_AUTO_SUSPENDED',
              entity_type: 'reviewer',
              entity_id: reviewer.wallet,
              new_data: {
                accuracy,
                total_votes: closedReviews.length,
                correct_votes: correctVotes,
                suspended_until: updateData.suspended_until,
              },
            });
          }

          await prisma.reviewerWallet.update({
            where: { wallet: reviewer.wallet },
            data: updateData,
          });
        }
      }

      return { processed: reviewers.length };
    } catch (error) {
      console.error('Error in computeAccuracyAndSuspend:', error);
      throw error;
    }
  }

  // Unsuspend reviewers whose suspension period has ended (run daily)
  static async unsuspendReviewers() {
    try {
      const now = new Date();
      const result = await prisma.reviewerWallet.updateMany({
        where: {
          enabled: false,
          suspended_until: { lt: now },
        },
        data: {
          enabled: true,
          suspended_until: null,
        },
      });

      if (result.count > 0) {
        await AuditService.log({
          action: 'REVIEWERS_AUTO_UNSUSPENDED',
          entity_type: 'reviewer',
          entity_id: 'batch',
          new_data: { count: result.count },
        });
      }

      return { unsuspended: result.count };
    } catch (error) {
      console.error('Error in unsuspendReviewers:', error);
      throw error;
    }
  }
}
