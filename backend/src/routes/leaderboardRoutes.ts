import express from 'express';
import { leaderboardController } from '../controllers/leaderboardController';

const router = express.Router();

router.get('/countries', leaderboardController.countries);
router.get('/users', leaderboardController.users);

export { router as leaderboardRoutes };
