import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/setup/create-challenge
 * Create the main challenge (one-time setup)
 */
router.post('/create-challenge', async (req, res) => {
  try {
    // Check if main challenge already exists
    const existing = await prisma.challenge.findUnique({
      where: { id: 'main-challenge' },
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Main challenge already exists',
        challenge: existing,
      });
    }

    // Create main challenge
    const challenge = await prisma.challenge.create({
      data: {
        id: 'main-challenge',
        title: '13-Week Transformation Challenge',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        rules: 'Complete 13 weeks of fitness and nutrition goals',
        active: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Main challenge created successfully',
      challenge,
    });
  } catch (error: any) {
    console.error('Failed to create challenge:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create challenge',
      details: error.message,
    });
  }
});

/**
 * GET /api/setup/check-challenge
 * Check if main challenge exists
 */
router.get('/check-challenge', async (req, res) => {
  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: 'main-challenge' },
    });

    res.status(200).json({
      success: true,
      exists: !!challenge,
      challenge: challenge || null,
    });
  } catch (error: any) {
    console.error('Failed to check challenge:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check challenge',
      details: error.message,
    });
  }
});

export default router;
