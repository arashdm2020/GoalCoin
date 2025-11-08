import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Shopify Integration Controller
 */
export const shopifyController = {
  /**
   * POST /api/shopify/redeem
   * Redeem Shopify order code for challenge entry
   */
  async redeemOrderCode(req: Request, res: Response): Promise<void> {
    try {
      const { orderCode, wallet } = req.body;

      if (!orderCode || !wallet) {
        res.status(400).json({ error: 'Order code and wallet address are required' });
        return;
      }

      // Validate wallet format
      if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
        res.status(400).json({ error: 'Invalid wallet address' });
        return;
      }

      // Check if order code already redeemed
      const existingRedemption = await prisma.shopifyRedemption.findUnique({
        where: { order_code: orderCode },
      });

      if (existingRedemption) {
        res.status(400).json({ error: 'Order code already redeemed' });
        return;
      }

      // TODO: Verify order code with Shopify API
      // For MVP, we'll accept any format and mark as redeemed

      // Find or create user
      const user = await prisma.user.upsert({
        where: { wallet: wallet.toLowerCase() },
        update: {
          last_activity_date: new Date(),
        },
        create: {
          wallet: wallet.toLowerCase(),
          tier: 'FAN', // Default tier, can be upgraded based on order
          xp_points: 0,
          goal_points: 0,
          current_streak: 0,
          longest_streak: 0,
          burn_multiplier: 1.0,
          is_holder: false,
          micro_goal_points: 0,
          last_activity_date: new Date(),
        },
      });

      // Create redemption record
      const redemption = await prisma.shopifyRedemption.create({
        data: {
          order_code: orderCode,
          user_id: user.id,
          redeemed_at: new Date(),
        },
      });

      res.status(200).json({
        success: true,
        message: 'Order code redeemed successfully',
        user: {
          id: user.id,
          wallet: user.wallet,
          tier: user.tier,
        },
        redemption: {
          id: redemption.id,
          order_code: redemption.order_code,
          redeemed_at: redemption.redeemed_at,
        },
      });
    } catch (error) {
      console.error('Error in redeemOrderCode:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * GET /api/shopify/verify/:orderCode
   * Verify if order code is valid and not redeemed
   */
  async verifyOrderCode(req: Request, res: Response): Promise<void> {
    try {
      const { orderCode } = req.params;

      if (!orderCode) {
        res.status(400).json({ error: 'Order code is required' });
        return;
      }

      // Check if already redeemed
      const redemption = await prisma.shopifyRedemption.findUnique({
        where: { order_code: orderCode },
      });

      if (redemption) {
        res.status(200).json({
          valid: false,
          redeemed: true,
          message: 'Order code already redeemed',
        });
        return;
      }

      // TODO: Verify with Shopify API
      // For MVP, assume all codes are valid if not redeemed

      res.status(200).json({
        valid: true,
        redeemed: false,
        message: 'Order code is valid and available',
      });
    } catch (error) {
      console.error('Error in verifyOrderCode:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

export default shopifyController;
