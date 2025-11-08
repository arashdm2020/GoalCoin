import express from 'express';
import utilityBridgeController from '../controllers/utilityBridgeController';

const router = express.Router();

// Referral routes
router.post('/referral', utilityBridgeController.createReferral);
router.get('/referrals/:userId', utilityBridgeController.getUserReferrals);
router.get('/referral-leaderboard', utilityBridgeController.getReferralLeaderboard);

// Ad view routes
router.post('/ad-view', utilityBridgeController.logAdView);

export { router as utilityBridgeRoutes };
