import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COMMISSION_PER_VOTE = 0.005; // $0.005 USDT per vote

export const reviewController = {
  async getAssignedSubmissions(req: Request, res: Response): Promise<void> {
    const { reviewer_wallet } = req.params;

    try {
      const assignments = await prisma.reviewAssignment.findMany({
        where: {
          reviewer_wallet,
          status: 'PENDING',
          expires_at: { gt: new Date() },
        },
        include: {
          submission: {
            include: {
              user: { select: { handle: true } },
            },
          },
        },
      });

      res.status(200).json(assignments);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      res.status(500).json({ error: 'Failed to fetch assignments' });
    }
  },

  async submitVote(req: Request, res: Response): Promise<void> {
    const { assignment_id, vote, reviewer_wallet } = req.body;

    if (!assignment_id || !vote || !reviewer_wallet) {
      res.status(400).json({ error: 'Assignment ID, vote, and reviewer wallet are required' });
      return;
    }

    if (!['APPROVE', 'REJECT'].includes(vote)) {
      res.status(400).json({ error: 'Vote must be APPROVE or REJECT' });
      return;
    }

    try {
      // Check if assignment exists and is valid
      const assignment = await prisma.reviewAssignment.findUnique({
        where: { id: assignment_id },
        include: { submission: true },
      });

      if (!assignment) {
        res.status(404).json({ error: 'Assignment not found' });
        return;
      }

      if (assignment.reviewer_wallet !== reviewer_wallet) {
        res.status(403).json({ error: 'Not authorized for this assignment' });
        return;
      }

      if (assignment.status !== 'PENDING') {
        res.status(400).json({ error: 'Assignment already completed' });
        return;
      }

      if (assignment.expires_at < new Date()) {
        res.status(400).json({ error: 'Assignment has expired' });
        return;
      }

      // Create the review and update assignment
      await prisma.$transaction(async (tx) => {
        const review = await tx.review.create({
          data: {
            submission_id: assignment.submission_id,
            reviewer_wallet,
            vote: vote as 'APPROVE' | 'REJECT',
            assignment_id,
          },
        });

        await tx.reviewAssignment.update({
          where: { id: assignment_id },
          data: { status: 'VOTED' },
        });

        // Check if we have reached quorum (3 votes)
        const allReviews = await tx.review.findMany({
          where: { submission_id: assignment.submission_id },
        });

        if (allReviews.length >= 3) {
          const approvals = allReviews.filter(r => r.vote === 'APPROVE').length;
          const rejections = allReviews.filter(r => r.vote === 'REJECT').length;

          let finalStatus: 'APPROVED' | 'REJECTED' | 'PENDING' = 'PENDING';
          
          if (approvals >= 3) {
            finalStatus = 'APPROVED';
          } else if (rejections >= 3) {
            finalStatus = 'REJECTED';
          }

          if (finalStatus !== 'PENDING') {
            // Close the submission
            await tx.submission.update({
              where: { id: assignment.submission_id },
              data: {
                status: finalStatus,
                closed_at: new Date(),
              },
            });

            // Award commissions to all reviewers who voted
            await Promise.all(
              allReviews.map(review =>
                tx.commission.create({
                  data: {
                    reviewer_wallet: review.reviewer_wallet,
                    submission_id: assignment.submission_id,
                    amount_usdt: COMMISSION_PER_VOTE,
                  },
                })
              )
            );
          }
        }

        return review;
      });

      res.status(201).json({ message: 'Vote submitted successfully' });
    } catch (error) {
      console.error('Failed to submit vote:', error);
      res.status(500).json({ error: 'Failed to submit vote' });
    }
  },

  async getReviewHistory(req: Request, res: Response): Promise<void> {
    const { reviewer_wallet } = req.params;

    try {
      const reviews = await prisma.review.findMany({
        where: { reviewer_wallet },
        include: {
          submission: {
            select: {
              id: true,
              week_no: true,
              status: true,
              user: { select: { handle: true } },
            },
          },
        },
        orderBy: { voted_at: 'desc' },
      });

      res.status(200).json(reviews);
    } catch (error) {
      console.error('Failed to fetch review history:', error);
      res.status(500).json({ error: 'Failed to fetch review history' });
    }
  },
};
