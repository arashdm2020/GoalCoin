import express from 'express';
import { paymentController } from '../controllers/paymentController';

const router = express.Router();

router.post('/challenge', paymentController.createChallengePayment);

export { router as paymentRoutes };
