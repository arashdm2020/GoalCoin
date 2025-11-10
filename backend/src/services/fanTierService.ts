/**
 * Fan Tier Service - Auto-progression system
 * Tiers: MINTED → STAKED → VERIFIED → ASCENDANT → APEX
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TierConfig {
  tier: string;
  min_xp: number;
  max_xp: number | null;
  badge_url: string;
  burn_multiplier_bonus: number;
  description: string;
  color: string;
  icon: string;
}

class FanTierService {
  /**
   * Get tier info for a specific tier
   */
  async getTierInfo(tier: string): Promise<TierConfig | null> {
    const result = await prisma.$queryRaw<TierConfig[]>`
      SELECT * FROM fan_tier_config WHERE tier = ${tier}
    `;
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Get all tier configurations
   */
  async getAllTiers(): Promise<TierConfig[]> {
    return await prisma.$queryRaw<TierConfig[]>`
      SELECT * FROM fan_tier_config ORDER BY min_xp ASC
    `;
  }

  /**
   * Get user's current tier and progress
   */
  async getUserTierProgress(userId: string): Promise<any> {
    const user = await prisma.$queryRaw<any[]>`
      SELECT fan_tier, xp_points, tier_updated_at
      FROM users
      WHERE id = ${userId}
    `;

    if (user.length === 0) return null;

    const userData = user[0];
    const currentTierInfo = await this.getTierInfo(userData.fan_tier || 'MINTED');
    const allTiers = await this.getAllTiers();

    // Find next tier
    const currentIndex = allTiers.findIndex(t => t.tier === userData.fan_tier);
    const nextTier = currentIndex < allTiers.length - 1 ? allTiers[currentIndex + 1] : null;

    // Calculate progress to next tier
    let progress = 0;
    let xpNeeded = 0;

    if (nextTier && currentTierInfo) {
      const xpInCurrentTier = userData.xp_points - currentTierInfo.min_xp;
      const xpRangeForTier = nextTier.min_xp - currentTierInfo.min_xp;
      progress = Math.min((xpInCurrentTier / xpRangeForTier) * 100, 100);
      xpNeeded = nextTier.min_xp - userData.xp_points;
    }

    return {
      currentTier: userData.fan_tier,
      currentTierInfo,
      nextTier: nextTier?.tier || null,
      nextTierInfo: nextTier,
      xpPoints: userData.xp_points,
      progress: Math.round(progress),
      xpNeeded: Math.max(xpNeeded, 0),
      tierUpdatedAt: userData.tier_updated_at
    };
  }

  /**
   * Get tier progression history for a user
   */
  async getTierHistory(userId: string, limit: number = 10): Promise<any[]> {
    return await prisma.$queryRaw`
      SELECT * FROM tier_progression_history
      WHERE user_id = ${userId}
      ORDER BY promoted_at DESC
      LIMIT ${limit}
    `;
  }

  /**
   * Get tier distribution statistics
   */
  async getTierDistribution(): Promise<any[]> {
    return await prisma.$queryRaw`
      SELECT 
        fan_tier as tier,
        COUNT(*) as user_count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM users
      WHERE fan_tier IS NOT NULL
      GROUP BY fan_tier
      ORDER BY 
        CASE fan_tier
          WHEN 'MINTED' THEN 1
          WHEN 'STAKED' THEN 2
          WHEN 'VERIFIED' THEN 3
          WHEN 'ASCENDANT' THEN 4
          WHEN 'APEX' THEN 5
        END
    `;
  }

  /**
   * Get top users by tier
   */
  async getTopUsersByTier(tier: string, limit: number = 10): Promise<any[]> {
    return await prisma.$queryRaw`
      SELECT 
        id,
        handle,
        wallet,
        xp_points,
        fan_tier,
        current_streak
      FROM users
      WHERE fan_tier = ${tier}::fan_tier
      ORDER BY xp_points DESC
      LIMIT ${limit}
    `;
  }

  /**
   * Calculate burn multiplier for a tier
   */
  getBurnMultiplier(tier: string): number {
    const multipliers: Record<string, number> = {
      'MINTED': 1.01,
      'STAKED': 1.02,
      'VERIFIED': 1.03,
      'ASCENDANT': 1.04,
      'APEX': 1.05
    };
    return multipliers[tier] || 1.0;
  }
}

export const fanTierService = new FanTierService();
