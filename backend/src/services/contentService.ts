/**
 * Micro-Content Service
 * Regional feeds, XP tracking for views/shares/likes
 */

import { PrismaClient } from '@prisma/client';
import { xpService } from './xpService';

const prisma = new PrismaClient();

class ContentService {
  /**
   * Get content feed for a region
   */
  async getContentFeed(region: string = 'global', limit: number = 20): Promise<any[]> {
    return await prisma.$queryRaw`
      SELECT * FROM content_items
      WHERE (region = ${region} OR region = 'global')
        AND active = true
      ORDER BY featured DESC, created_at DESC
      LIMIT ${limit}
    `;
  }

  /**
   * Track content interaction and award XP
   */
  async trackInteraction(
    userId: string,
    contentId: string,
    action: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    // Get action config
    const actionConfig = await prisma.$queryRaw<any[]>`
      SELECT * FROM content_action_config WHERE action = ${action}
    `;

    if (actionConfig.length === 0) {
      throw new Error('Invalid action type');
    }

    const config = actionConfig[0];

    // Check daily cap
    if (config.daily_cap > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayCount = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM content_interactions
        WHERE user_id = ${userId}
          AND action = ${action}
          AND created_at >= ${today}
      `;

      if (Number(todayCount[0].count) >= config.daily_cap) {
        return {
          success: false,
          message: `Daily cap reached for ${action}. Limit: ${config.daily_cap}/day`
        };
      }
    }

    // Check if already interacted today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.$queryRaw<any[]>`
      SELECT * FROM content_interactions
      WHERE user_id = ${userId}
        AND content_id = ${contentId}::uuid
        AND action = ${action}
        AND DATE(created_at) = DATE(${today})
    `;

    if (existing.length > 0) {
      return {
        success: false,
        message: 'Already performed this action today'
      };
    }

    // Award XP using XP service
    const xpResult = await xpService.awardXP({
      userId,
      actionKey: `content_${action}`,
      idempotencyKey: `content_${contentId}_${action}_${userId}_${Date.now()}`,
      metadata: { contentId, ...metadata }
    });

    // Log interaction
    await prisma.$executeRaw`
      INSERT INTO content_interactions (user_id, content_id, action, xp_earned, metadata)
      VALUES (${userId}, ${contentId}::uuid, ${action}, ${xpResult.xpEarned}, ${JSON.stringify(metadata || {})})
    `;

    return {
      success: true,
      xpEarned: xpResult.xpEarned,
      message: xpResult.message
    };
  }

  /**
   * Get user's content interaction history
   */
  async getUserInteractions(userId: string, limit: number = 50): Promise<any[]> {
    return await prisma.$queryRaw`
      SELECT 
        ci.*,
        c.title,
        c.type
      FROM content_interactions ci
      JOIN content_items c ON ci.content_id = c.id
      WHERE ci.user_id = ${userId}
      ORDER BY ci.created_at DESC
      LIMIT ${limit}
    `;
  }

  /**
   * Get trending content
   */
  async getTrendingContent(region: string = 'global', limit: number = 10): Promise<any[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return await prisma.$queryRaw`
      SELECT 
        c.*,
        COUNT(ci.id) as interaction_count
      FROM content_items c
      LEFT JOIN content_interactions ci ON c.id = ci.content_id
        AND ci.created_at >= ${sevenDaysAgo}
      WHERE (c.region = ${region} OR c.region = 'global')
        AND c.active = true
      GROUP BY c.id
      ORDER BY interaction_count DESC, c.view_count DESC
      LIMIT ${limit}
    `;
  }

  /**
   * Get content by ID
   */
  async getContentById(contentId: string): Promise<any> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM content_items WHERE id = ${contentId}::uuid
    `;
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Admin: Create content
   */
  async createContent(data: any): Promise<any> {
    const { type, title, description, url, region, xp_reward, duration_sec } = data;

    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO content_items (type, title, description, url, region, xp_reward, duration_sec)
      VALUES (${type}, ${title}, ${description}, ${url}, ${region}, ${xp_reward}, ${duration_sec})
      RETURNING *
    `;

    return result[0];
  }

  /**
   * Admin: Update content
   */
  async updateContent(contentId: string, data: any): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      updates.push(`${key} = $${values.length + 1}`);
      values.push(value);
    });

    if (updates.length === 0) return;

    await prisma.$executeRawUnsafe(`
      UPDATE content_items
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${values.length + 1}
    `, ...values, contentId);
  }

  /**
   * Admin: Delete content
   */
  async deleteContent(contentId: string): Promise<void> {
    await prisma.$executeRaw`
      DELETE FROM content_items WHERE id = ${contentId}::uuid
    `;
  }
}

export const contentService = new ContentService();
