import express from 'express';
import { leaderboardController } from '../controllers/leaderboardController';

const router = express.Router();

router.get('/countries', leaderboardController.getCountries);
router.get('/users', leaderboardController.getUsersByCountry);

export { router as leaderboardRoutes };
