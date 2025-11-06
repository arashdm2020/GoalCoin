import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const challengeController = {
  async createChallenge(req: Request, res: Response): Promise<void> {
    const { title, start_date, end_date, rules } = req.body;

    if (!title || !start_date || !end_date) {
      res.status(400).json({ error: 'Title, start_date, and end_date are required' });
      return;
    }

    try {
      const challenge = await prisma.challenge.create({
        data: {
          title,
          start_date: new Date(start_date),
          end_date: new Date(end_date),
          rules,
          active: true,
        },
      });

      res.status(201).json(challenge);
    } catch (error) {
      console.error('Failed to create challenge:', error);
      res.status(500).json({ error: 'Failed to create challenge' });
    }
  },

  async getActiveChallenges(req: Request, res: Response): Promise<void> {
    try {
      const challenges = await prisma.challenge.findMany({
        where: { active: true },
        orderBy: { start_date: 'desc' },
      });

      res.status(200).json(challenges);
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
      res.status(500).json({ error: 'Failed to fetch challenges' });
    }
  },

  async getChallengeById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const challenge = await prisma.challenge.findUnique({
        where: { id },
        include: {
          submissions: {
            include: {
              user: { select: { wallet: true, handle: true } },
              reviews: true,
            },
          },
        },
      });

      if (!challenge) {
        res.status(404).json({ error: 'Challenge not found' });
        return;
      }

      res.status(200).json(challenge);
    } catch (error) {
      console.error('Failed to fetch challenge:', error);
      res.status(500).json({ error: 'Failed to fetch challenge' });
    }
  },
};
