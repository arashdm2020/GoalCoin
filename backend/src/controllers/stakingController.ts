import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Staking Simulation Controller (Polygon Mumbai Testnet)
 */
export const stakingController = {
  /**
   * POST /api/staking/test-stake
   * Simulate a test stake ($1-$3) on Mumbai testnet
   */
  async testStake(req: Request, res: Response): Promise<void> {
    try {
      const { wallet, amount } = req.body;

      if (!wallet || !amount) {
        res.status(400).json({ error: 'Wallet and amount are required' });
        return;
      }

      // Validate wallet format
      if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
        res.status(400).json({ error: 'Invalid wallet address' });
        return;
      }

      // Validate amount ($1-$3)
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum < 1 || amountNum > 3) {
        res.status(400).json({ error: 'Amount must be between $1 and $3' });
        return;
      }

      // Create test stake record
      const testStake = await prisma.testStake.create({
        data: {
          wallet: wallet.toLowerCase(),
          amount_usd: amountNum,
          network: 'mumbai',
          status: 'pending',
        },
      });

      // TODO: Interact with Mumbai testnet smart contract
      // For MVP, we'll just simulate the stake

      // Update status to active
      const updatedStake = await prisma.testStake.update({
        where: { id: testStake.id },
        data: {
          status: 'active',
          tx_hash: `0x${Math.random().toString(16).substring(2, 66)}`, // Mock tx hash
        },
      });

      res.status(200).json({
        success: true,
        message: 'Test stake created successfully',
        stake: {
          id: updatedStake.id,
          wallet: updatedStake.wallet,
          amount: updatedStake.amount_usd,
          network: updatedStake.network,
          status: updatedStake.status,
          tx_hash: updatedStake.tx_hash,
          created_at: updatedStake.created_at,
        },
      });
    } catch (error) {
      console.error('Error in testStake:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * GET /api/staking/stakes/:wallet
   * Get all stakes for a wallet
   */
  async getStakes(req: Request, res: Response): Promise<void> {
    try {
      const { wallet } = req.params;

      if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
        res.status(400).json({ error: 'Valid wallet address is required' });
        return;
      }

      const stakes = await prisma.testStake.findMany({
        where: { wallet: wallet.toLowerCase() },
        orderBy: { created_at: 'desc' },
      });

      res.status(200).json({
        success: true,
        stakes,
      });
    } catch (error) {
      console.error('Error in getStakes:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * POST /api/staking/unstake/:stakeId
   * Unstake a test stake
   */
  async unstake(req: Request, res: Response): Promise<void> {
    try {
      const { stakeId } = req.params;

      const stake = await prisma.testStake.findUnique({
        where: { id: stakeId },
      });

      if (!stake) {
        res.status(404).json({ error: 'Stake not found' });
        return;
      }

      if (stake.status !== 'active') {
        res.status(400).json({ error: 'Stake is not active' });
        return;
      }

      // Update status to unstaked
      const updatedStake = await prisma.testStake.update({
        where: { id: stakeId },
        data: {
          status: 'unstaked',
          unstaked_at: new Date(),
        },
      });

      res.status(200).json({
        success: true,
        message: 'Stake unstaked successfully',
        stake: updatedStake,
      });
    } catch (error) {
      console.error('Error in unstake:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

export default stakingController;
