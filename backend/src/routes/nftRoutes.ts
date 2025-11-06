import express from 'express';
import { nftController } from '../controllers/nftController';

const router = express.Router();

router.get('/placeholder', nftController.placeholder);

export { router as nftRoutes };
