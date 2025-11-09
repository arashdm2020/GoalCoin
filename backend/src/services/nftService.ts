import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const nftService = {
  /**
   * Check if wallet has Founder NFT
   */
  async checkNFT(walletAddress: string) {
    try {
      // For MVP, check if user has FOUNDER tier
      const user = await prisma.user.findFirst({
        where: { 
          wallet: walletAddress,
          tier: 'FOUNDER',
        },
      });

      return {
        hasNFT: !!user,
        tier: user?.tier,
        benefits: user ? {
          burn_multiplier: 2.0,
          voting_power: 2,
          early_access: true,
        } : null,
      };
    } catch (error) {
      console.error('Error checking NFT:', error);
      throw error;
    }
  },

  /**
   * Get NFT metadata
   */
  async getNFTMetadata(walletAddress: string) {
    try {
      const user = await prisma.user.findFirst({
        where: { wallet: walletAddress },
      });

      if (!user || user.tier !== 'FOUNDER') {
        return null;
      }

      return {
        name: `GoalCoin Founder #${user.id.slice(0, 8)}`,
        description: 'Exclusive Founder NFT for GoalCoin ecosystem',
        attributes: [
          { trait_type: 'Tier', value: 'Founder' },
          { trait_type: 'Burn Multiplier', value: '2x' },
          { trait_type: 'Voting Power', value: '2' },
          { trait_type: 'Member Since', value: user.created_at.toISOString().split('T')[0] },
        ],
      };
    } catch (error) {
      console.error('Error getting NFT metadata:', error);
      throw error;
    }
  },

  /**
   * Grant Founder NFT benefits
   */
  async grantFounderBenefits(userId: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          tier: 'FOUNDER',
          burn_multiplier: 2.0,
          founder_nft: true,
        },
      });

      return { success: true, message: 'Founder benefits granted' };
    } catch (error) {
      console.error('Error granting founder benefits:', error);
      throw error;
    }
  },
};
