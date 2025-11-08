import express from 'express';
import shopifyController from '../controllers/shopifyController';

const router = express.Router();

/**
 * POST /api/shopify/redeem
 * Redeem Shopify order code for challenge entry
 */
router.post('/redeem', shopifyController.redeemOrderCode);

/**
 * GET /api/shopify/verify/:orderCode
 * Verify if order code is valid
 */
router.get('/verify/:orderCode', shopifyController.verifyOrderCode);

export { router as shopifyRoutes };
