import express from 'express';
import { challengeController } from '../controllers/challengeController';
import { basicAuthMiddleware } from '../middleware/basicAuth';

const router = express.Router();

router.post('/', basicAuthMiddleware, challengeController.createChallenge);
router.get('/', challengeController.getActiveChallenges);
router.get('/:id', challengeController.getChallengeById);

export { router as challengeRoutes };
