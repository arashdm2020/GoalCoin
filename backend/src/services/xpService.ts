/**
 * XP Service - Configurable XP Engine with Multipliers
 */

import { PrismaClient } from '@prisma/client';
import { countryLeaderboardService } from './countryLeaderboardService';

const prisma = new PrismaClient();

interface XPEventParams {
  userId: string;
  actionKey: string;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
}

interface XPResult {
  success: boolean;
  xpEarned: number;
  xpBase: number;
  multiplier: number;
  streakDays: number;
  newTotal: number;
  message?: string;
}

class XPService {
  async awardXP(params: XPEventParams): Promise<XPResult> {
    const { userId, actionKey, idempotencyKey, metadata } = params;

    try {
      // Check idempotency
      if (idempotencyKey) {
        const existing = await prisma.$queryRaw<any[]>`
          SELECT * FROM xp_events WHERE idempotency_key = ${idempotencyKey}
        `;
        if (existing.length > 0) {
          return this.formatResult(existing[0]);
        }
      }

      // Get action config
      const action = await prisma.$queryRaw<any[]>`
        SELECT * FROM action_types WHERE action_key = ${actionKey}
      `;
      
      if (action.length === 0 || !action[0].enabled) {
        throw new Error('Action not found or disabled');
      }

      const actionConfig = action[0];

      // Check cooldown
      if (actionConfig.cooldown_sec > 0) {
        const cooldownTime = new Date(Date.now() - actionConfig.cooldown_sec * 1000);
        const recentEvent = await prisma.$queryRaw<any[]>`
          SELECT * FROM xp_events 
          WHERE user_id = ${userId} 
            AND action_key = ${actionKey}
            AND created_at >= ${cooldownTime}
          LIMIT 1
        `;
        
        if (recentEvent.length > 0) {
          const remainingSeconds = Math.ceil(
            (actionConfig.cooldown_sec - (Date.now() - new Date(recentEvent[0].created_at).getTime()) / 1000)
          );
          throw new Error(`Cooldown active. Wait ${remainingSeconds}s`);
        }
      }

      // Check daily cap
      if (actionConfig.daily_cap > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayCount = await prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count FROM xp_events 
          WHERE user_id = ${userId} 
            AND action_key = ${actionKey}
            AND created_at >= ${today}
        `;
        
        if (Number(todayCount[0].count) >= actionConfig.daily_cap) {
          throw new Error(`Daily cap reached: ${actionConfig.daily_cap}/day`);
        }
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) throw new Error('User not found');

      // Calculate multipliers
      const streakMult = this.calculateStreakMultiplier(user.current_streak);
      const milestoneMult = this.calculateMilestoneMultiplier(user);
      const totalMult = Math.min(streakMult * milestoneMult, actionConfig.multiplier_cap);

      const xpBase = actionConfig.xp_value;
      const xpFinal = Math.floor(xpBase * totalMult);

      // Update in transaction
      const result = await prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            xp_points: { increment: xpFinal },
            last_activity_date: new Date()
          }
        });

        await tx.$executeRaw`
          INSERT INTO xp_events (user_id, action_key, xp_base, xp_multiplier, xp_final, streak_days, idempotency_key, metadata)
          VALUES (${userId}, ${actionKey}, ${xpBase}, ${totalMult}, ${xpFinal}, ${user.current_streak}, ${idempotencyKey}, ${JSON.stringify(metadata || {})})
        `;

        return updatedUser;
      });

      // Update country leaderboard stats
      await countryLeaderboardService.updateCountryStats(userId, xpFinal);

      return {
        success: true,
        xpEarned: xpFinal,
        xpBase,
        multiplier: totalMult,
        streakDays: user.current_streak,
        newTotal: result.xp_points,
        message: `+${xpFinal} XP (${xpBase} × ${totalMult.toFixed(2)}x)`
      };

    } catch (error: any) {
      return {
        success: false,
        xpEarned: 0,
        xpBase: 0,
        multiplier: 1.0,
        streakDays: 0,
        newTotal: 0,
        message: error.message
      };
    }
  }

  private calculateStreakMultiplier(streakDays: number): number {
    const weeks = Math.floor(streakDays / 7);
    const bonus = Math.min(weeks * 0.02, 0.10);
    return 1.0 + bonus;
  }

  private calculateMilestoneMultiplier(user: any): number {
    const has90Day = user.tier === 'PLAYER' || user.tier === 'FOUNDER';
    if (has90Day) return 1.5;

    const daysSinceJoin = Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceJoin >= 45) return 1.25;

    return 1.0;
  }

  private formatResult(event: any): XPResult {
    return {
      success: true,
      xpEarned: event.xp_final,
      xpBase: event.xp_base,
      multiplier: event.xp_multiplier,
      streakDays: event.streak_days,
      newTotal: 0,
      message: 'Already processed (idempotent)'
    };
  }

  async updateStreaks(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const users = await prisma.user.findMany({
      where: { last_activity_date: { not: null } }
    });

    for (const user of users) {
      const lastActivity = new Date(user.last_activity_date!);
      lastActivity.setHours(0, 0, 0, 0);

      if (lastActivity >= yesterday) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            current_streak: { increment: 1 },
            longest_streak: Math.max(user.longest_streak, user.current_streak + 1)
          }
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { current_streak: 0 }
        });
      }
    }
  }

  async getActions() {
    return await prisma.$queryRaw`
      SELECT * FROM action_types WHERE enabled = true ORDER BY action_key
    `;
  }

  async getUserXPHistory(userId: string, limit: number = 50) {
    return await prisma.$queryRaw`
      SELECT e.*, a.description 
      FROM xp_events e
      JOIN action_types a ON e.action_key = a.action_key
      WHERE e.user_id = ${userId}
      ORDER BY e.created_at DESC
      LIMIT ${limit}
    `;
  }
}

export const xpService = new XPService();
