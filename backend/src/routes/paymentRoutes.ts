import express from 'express';
import { paymentController } from '../controllers/paymentController';

const router = express.Router();

router.post('/challenge', paymentController.createChallengePayment);
router.post('/create', paymentController.createChallengePayment); // Alias for frontend

export { router as paymentRoutes };
