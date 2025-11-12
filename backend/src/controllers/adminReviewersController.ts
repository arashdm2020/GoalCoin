import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const adminReviewersController = {
  /**
   * GET /api/admin/reviewers
   * Get a list of all reviewers with filtering
   */
  async getReviewers(req: Request, res: Response): Promise<void> {
    try {
      // Filtering logic will be added here
      const reviewers = await prisma.reviewer.findMany({
        include: {
          user: {
            select: { wallet: true, handle: true },
          },
        },
      });

      res.status(200).json({ success: true, data: reviewers });
    } catch (error) {
      console.error('Error in getReviewers:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
