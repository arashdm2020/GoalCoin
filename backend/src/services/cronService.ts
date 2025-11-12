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
            include: { user: true },
          },
        },
      });

      if (expiredAssignments.length > 0) {
        console.log(`Found ${expiredAssignments.length} expired assignments to reassign.`);
      }

      for (const assignment of expiredAssignments) {
        // Mark current assignment as reassigned
        await prisma.reviewAssignment.update({
          where: { id: assignment.id },
          data: { status: 'REASSIGNED' },
        });

        // Check if submission still needs more reviewers
        const existingReviews = await prisma.review.count({
          where: { submission_id: assignment.submission_id },
        });

        if (existingReviews < 3) {
          // Get all wallets that have already reviewed or been assigned this submission
          const assignedWallets = (await prisma.reviewAssignment.findMany({
            where: { submission_id: assignment.submission_id },
            select: { reviewer_wallet: true },
          })).map(a => a.reviewer_wallet);

          // Also exclude reviewers who reviewed this user's submissions recently
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const recentReviewerWallets = (await prisma.review.findMany({
            where: {
              submission: { user_id: assignment.submission.user_id },
              voted_at: { gte: oneWeekAgo },
            },
            select: { reviewer_wallet: true },
          })).map(r => r.reviewer_wallet);

          const excludedWallets = [...new Set([...assignedWallets, ...recentReviewerWallets])];

          const availableReviewers = await prisma.reviewer.findMany({
            where: {
              status: 'ACTIVE',
              user: {
                wallet: { notIn: excludedWallets },
              },
            },
            take: 3 - existingReviews, // Assign up to the required number
            include: { user: true },
          });

          if (availableReviewers.length > 0) {
            const newAssignments = [];
            for (const reviewer of availableReviewers) {
              if (reviewer.user.wallet) {
                const newAssignment = await prisma.reviewAssignment.create({
                  data: {
                    submission_id: assignment.submission_id,
                    reviewer_wallet: reviewer.user.wallet,
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                  },
                });
                newAssignments.push(newAssignment);
              }
            }

            await AuditService.log({
              action: 'ASSIGNMENT_REASSIGNED',
              entity_type: 'submission',
              entity_id: assignment.submission_id,
              new_data: {
                expired_reviewer: assignment.reviewer_wallet,
                new_reviewers: newAssignments.map((a) => a.reviewer_wallet),
              },
            });
          }
        }
      }

      return { reassigned: expiredAssignments.length };
    } catch (error) {
      console.error('Error in reassignExpiredAssignments:', error);
      throw error;
    }
  }

  // TODO: Implement accuracy calculation and (un)suspension logic
  // The following fields need to be added to the Reviewer model in schema.prisma:
  // total_votes     Int       @default(0)
  // wrong_votes     Int       @default(0)
  // suspended_until DateTime? 

  static async computeAccuracyAndSuspend() {
    console.log('Skipping computeAccuracyAndSuspend: Not yet implemented.');
    return { processed: 0 };
  }

  static async unsuspendReviewers() {
    console.log('Skipping unsuspendReviewers: Not yet implemented.');
    return { unsuspended: 0 };
  }
}
