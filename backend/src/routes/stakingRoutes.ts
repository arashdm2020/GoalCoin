import express from 'express';
import stakingController from '../controllers/stakingController';

const router = express.Router();

/**
 * POST /api/staking/test-stake
 * Create a test stake on Mumbai testnet
 */
router.post('/test-stake', stakingController.testStake);

/**
 * GET /api/staking/stakes/:wallet
 * Get all stakes for a wallet
 */
router.get('/stakes/:wallet', stakingController.getStakes);

/**
 * POST /api/staking/unstake/:stakeId
 * Unstake a test stake
 */
router.post('/unstake/:stakeId', stakingController.unstake);

export { router as stakingRoutes };
