import express from 'express';
import { storeController } from '../controllers/storeController';

const router = express.Router();

router.get('/embed', storeController.embed);

export { router as storeRoutes };
