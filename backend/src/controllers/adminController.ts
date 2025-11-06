import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const adminController = {
  // --- Reviewer Management ---
  async addReviewer(req: Request, res: Response): Promise<void> {
    const { wallet } = req.body;
    if (!wallet) {
      res.status(400).json({ error: 'Wallet address is required' });
      return;
    }
    try {
      const reviewer = await prisma.reviewerWallet.create({
        data: { wallet },
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

  async assignSubmissionReviewers(req: Request, res: Response): Promise<void> {
    const { submission_id } = req.body;
    
    try {
      const submission = await prisma.submission.findUnique({ where: { id: submission_id } });
      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      const enabledReviewers = await prisma.reviewerWallet.findMany({ 
        where: { enabled: true } 
      });

      if (enabledReviewers.length < 5) {
        res.status(400).json({ error: 'Not enough enabled reviewers' });
        return;
      }

      // Randomly select 5 reviewers
      const selectedReviewers = enabledReviewers
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

      res.status(201).json({ assignments });
    } catch (error) {
      console.error('Failed to assign reviewers:', error);
      res.status(500).json({ error: 'Failed to assign reviewers' });
    }
  },
};
