import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const submissionController = {
  async createSubmission(req: Request, res: Response): Promise<void> {
    const { user_id, challenge_id, week_no, file_url, watermark_code } = req.body;

    console.log('[SUBMISSION] Create request:', { user_id, challenge_id, week_no, has_file_url: !!file_url, watermark_code });

    if (!user_id || !challenge_id || !week_no || !watermark_code) {
      res.status(400).json({ error: 'user_id, challenge_id, week_no, and watermark_code are required' });
      return;
    }

    if (!file_url) {
      res.status(400).json({ error: 'file_url is required' });
      return;
    }

    try {
      // Find user by ID (from JWT token)
      console.log('[SUBMISSION] Looking for user with ID:', user_id);
      const user = await prisma.user.findUnique({ 
        where: { id: user_id },
        select: {
          id: true,
          email: true,
          handle: true,
        }
      });
      if (!user) {
        console.error('[SUBMISSION] User not found with ID:', user_id);
        res.status(404).json({ error: 'User not found', user_id });
        return;
      }
      console.log('[SUBMISSION] User found:', user.id);

      // Verify challenge exists
      console.log('Checking challenge:', challenge_id);
      const challenge = await prisma.challenge.findUnique({ where: { id: challenge_id } });
      if (!challenge) {
        console.error('Challenge not found:', challenge_id);
        res.status(404).json({ error: 'Challenge not found', challenge_id });
        return;
      }
      console.log('Challenge found:', challenge.id);

      // Check if submission already exists for this week
      const existingSubmission = await prisma.submission.findFirst({
        where: {
          user_id: user.id,
          challenge_id,
          week_no,
        },
      });

      if (existingSubmission) {
        console.log('Submission already exists:', existingSubmission.id);
        res.status(400).json({ error: 'Submission already exists for this week' });
        return;
      }

      console.log('Creating submission...');
      const submission = await prisma.submission.create({
        data: {
          user_id: user.id,
          challenge_id,
          week_no,
          file_url,
          watermark_code,
          status: 'PENDING',
        },
      });

      console.log('Submission created successfully:', submission.id);
      res.status(201).json(submission);
    } catch (error: any) {
      console.error('Failed to create submission:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        meta: error.meta,
      });
      res.status(500).json({ 
        error: 'Failed to create submission',
        details: error.message 
      });
    }
  },

  async getUserSubmissions(req: Request, res: Response): Promise<void> {
    const { user_wallet } = req.params;

    try {
      const user = await prisma.user.findUnique({ where: { wallet: user_wallet } });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const submissions = await prisma.submission.findMany({
        where: { user_id: user.id },
        include: {
          reviews: true,
          assignments: true,
        },
        orderBy: { created_at: 'desc' },
      });

      res.status(200).json(submissions);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  },

  async getSubmissionById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const submission = await prisma.submission.findUnique({
        where: { id },
        include: {
          user: { select: { wallet: true, handle: true } },
          reviews: true,
          assignments: true,
        },
      });

      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      res.status(200).json(submission);
    } catch (error) {
      console.error('Failed to fetch submission:', error);
      res.status(500).json({ error: 'Failed to fetch submission' });
    }
  },

  async getMySubmissions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId; // From authMiddleware
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      console.log('[SUBMISSION] Fetching submissions for user:', userId);

      const submissions = await prisma.submission.findMany({
        where: { user_id: userId },
        orderBy: { week_no: 'asc' },
        select: {
          id: true,
          week_no: true,
          status: true,
          file_url: true,
          watermark_code: true,
          created_at: true,
        },
      });

      console.log('[SUBMISSION] Found submissions:', submissions.length);

      res.status(200).json({
        success: true,
        submissions,
      });
    } catch (error) {
      console.error('[SUBMISSION] Failed to fetch my submissions:', error);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  },
};
