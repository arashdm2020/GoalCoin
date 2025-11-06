import express from 'express';
import { webhooksController } from '../controllers/webhooksController';

const router = express.Router();

// This route needs raw body parsing, which is handled in index.ts
router.post('/coinpayments', webhooksController.coinpayments);

export { router as webhooksRoutes };
