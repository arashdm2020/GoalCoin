import express from 'express';
import fitnessController from '../controllers/fitnessController';

const router = express.Router();

// Warmup routes
router.get('/warmup-sessions', fitnessController.getWarmupSessions);
router.post('/warmup/log', fitnessController.logWarmup);

// Workout routes
router.post('/workout/log', fitnessController.logWorkout);

// Diet routes
router.get('/diet-plans', fitnessController.getDietPlans);
router.post('/meal/log', fitnessController.logMeal);

// Progress routes
router.get('/progress/:userId', fitnessController.getUserProgress);

export { router as fitnessRoutes };
