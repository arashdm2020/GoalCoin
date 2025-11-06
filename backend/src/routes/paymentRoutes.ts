import express from 'express';
import { paymentController } from '../controllers/paymentController';

const router = express.Router();

// POST /api/payments/checkout
router.post('/checkout', paymentController.checkout);

// GET /api/payments/pools
router.get('/pools', paymentController.pools);

export { router as paymentRoutes };
