import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Reward constants for non-holders
const REWARDS = {
  REFERRAL: 50,
  AD_VIEW: 5,
  SHARE: 10,
};

// Create referral
const createReferral = async (req: Request, res: Response) => {
  try {
    const { referrerId, referredId } = req.body;

    if (!referrerId || !referredId) {
      return res.status(400).json({ error: 'referrerId and referredId are required' });
    }

    // Check if referral already exists
    const existing = await prisma.referral.findUnique({
      where: {
        referrer_id_referred_id: {
          referrer_id: referrerId,
          referred_id: referredId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Referral already exists' });
    }

    // Create referral
    const referral = await prisma.referral.create({
      data: {
        referrer_id: referrerId,
        referred_id: referredId,
        reward_points: REWARDS.REFERRAL,
      },
    });

    // Update referrer's micro goal points
    await prisma.user.update({
      where: { id: referrerId },
      data: {
        micro_goal_points: { increment: REWARDS.REFERRAL },
      },
    });

    res.json({ success: true, referral, points_earned: REWARDS.REFERRAL });
  } catch (error) {
    console.error('Error creating referral:', error);
    res.status(500).json({ error: 'Failed to create referral' });
  }
};

// Log ad view
const logAdView = async (req: Request, res: Response) => {
  try {
    const { userId, adType } = req.body;

    if (!userId || !adType) {
      return res.status(400).json({ error: 'userId and adType are required' });
    }

    // Create ad view log
    const adView = await prisma.adView.create({
      data: {
        user_id: userId,
        ad_type: adType,
        reward_points: REWARDS.AD_VIEW,
      },
    });

    // Update user's micro goal points
    await prisma.user.update({
      where: { id: userId },
      data: {
        micro_goal_points: { increment: REWARDS.AD_VIEW },
      },
    });

    res.json({ success: true, adView, points_earned: REWARDS.AD_VIEW });
  } catch (error) {
    console.error('Error logging ad view:', error);
    res.status(500).json({ error: 'Failed to log ad view' });
  }
};

// Get user referrals
const getUserReferrals = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const referrals = await prisma.referral.findMany({
      where: { referrer_id: userId },
      include: {
        referred: {
          select: {
            id: true,
            handle: true,
            wallet: true,
            created_at: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const totalPoints = referrals.reduce((sum, ref) => sum + ref.reward_points, 0);

    res.json({
      referrals,
      total_referrals: referrals.length,
      total_points: totalPoints,
    });
  } catch (error) {
    console.error('Error fetching user referrals:', error);
    res.status(500).json({ error: 'Failed to fetch user referrals' });
  }
};

// Get leaderboard (top referrers)
const getReferralLeaderboard = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const topReferrers = await prisma.referral.groupBy({
      by: ['referrer_id'],
      _count: {
        id: true,
      },
      _sum: {
        reward_points: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    });

    // Get user details for top referrers
    const leaderboard = await Promise.all(
      topReferrers.map(async (item) => {
        const user = await prisma.user.findUnique({
          where: { id: item.referrer_id },
          select: {
            id: true,
            handle: true,
            wallet: true,
          },
        });
        return {
          user,
          referral_count: item._count.id,
          total_points: item._sum.reward_points || 0,
        };
      })
    );

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching referral leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch referral leaderboard' });
  }
};

export default {
  createReferral,
  logAdView,
  getUserReferrals,
  getReferralLeaderboard,
};
