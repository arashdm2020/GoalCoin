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
      const { orderCode, order_code, user_id, userId, wallet } = req.body;
      const finalOrderCode = orderCode || order_code;
      const finalUserId = user_id || userId;

      console.log('[SHOPIFY] Redeem request:', { orderCode, order_code, user_id, userId, wallet, finalOrderCode, finalUserId });

      if (!finalOrderCode) {
        res.status(400).json({ error: 'Order code is required' });
        return;
      }

      if (!finalUserId && !wallet) {
        res.status(400).json({ error: 'User ID or wallet address is required' });
        return;
      }

      // Check if order code already redeemed
      const existingRedemption = await prisma.shopifyRedemption.findUnique({
        where: { order_code: finalOrderCode },
      });

      if (existingRedemption) {
        console.log('[SHOPIFY] Order code already redeemed:', finalOrderCode);
        res.status(400).json({ error: 'Order code already redeemed' });
        return;
      }

      // Find user by ID or wallet
      const user = await prisma.user.findFirst({
        where: finalUserId ? { id: finalUserId } : { wallet: wallet },
        select: {
          id: true,
          email: true,
          wallet: true,
          handle: true,
          tier: true,
        },
      });

      if (!user) {
        console.log('[SHOPIFY] User not found:', { finalUserId, wallet });
        res.status(404).json({ error: 'User not found' });
        return;
      }

      console.log('[SHOPIFY] User found:', user.id);

      // TODO: Verify order code with Shopify API
      // For MVP, we'll accept any format and mark as redeemed

      // Update user's last activity - using unsafe raw query to bypass schema validation
      await prisma.$executeRawUnsafe(
        `UPDATE users SET last_activity_date = CURRENT_TIMESTAMP WHERE id = $1`,
        user.id
      );

      // Create redemption record
      const redemption = await prisma.shopifyRedemption.create({
        data: {
          order_code: finalOrderCode,
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
