import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const shopifyService = {
  /**
   * Verify Shopify webhook signature
   */
  verifyWebhook(body: string, hmacHeader: string): boolean {
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET || '';
    const hash = crypto
      .createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('base64');
    
    return hash === hmacHeader;
  },

  /**
   * Process Shopify order
   */
  async processOrder(orderData: any) {
    try {
      // Extract wallet address from order notes
      const walletAddress = orderData.note_attributes?.find(
        (attr: any) => attr.name === 'wallet_address'
      )?.value;

      if (!walletAddress) {
        console.log('No wallet address in order:', orderData.order_number);
        return { success: false, message: 'No wallet address provided' };
      }

      // Find or create user
      let user = await prisma.user.findFirst({
        where: { wallet: walletAddress },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            wallet: walletAddress,
            email: orderData.email || `${walletAddress}@temp.com`,
            handle: orderData.customer?.first_name || 'User',
            country_code: orderData.shipping_address?.country_code || 'US',
          },
        });
      }

      // Determine tier based on order total
      const totalPrice = parseFloat(orderData.total_price);
      let tier: 'FAN' | 'FOUNDER' | 'PLAYER' = 'FAN';
      if (totalPrice >= 49) tier = 'PLAYER';
      else if (totalPrice >= 35) tier = 'FOUNDER';

      // Update user tier
      await prisma.user.update({
        where: { id: user.id },
        data: {
          tier,
          founder_nft: tier === 'FOUNDER',
        },
      });

      return {
        success: true,
        user_id: user.id,
        tier,
        message: 'Order processed successfully',
      };
    } catch (error) {
      console.error('Error processing Shopify order:', error);
      throw error;
    }
  },

  /**
   * Redeem order by order number
   */
  async redeemOrder(params: {
    orderNumber: string;
    email: string;
    walletAddress: string;
  }) {
    try {
      // In production, this would verify with Shopify API
      // For now, just update user
      let user = await prisma.user.findFirst({
        where: { wallet: params.walletAddress },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            wallet: params.walletAddress,
            email: params.email,
            handle: params.email.split('@')[0],
          },
        });
      }

      // Grant tier based on order (simplified)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          tier: 'FOUNDER',
          founder_nft: true,
        },
      });

      return {
        success: true,
        tier: 'FOUNDER',
        challenge_unlocked: true,
        message: 'Order redeemed successfully!',
      };
    } catch (error) {
      console.error('Error redeeming order:', error);
      throw error;
    }
  },
};
