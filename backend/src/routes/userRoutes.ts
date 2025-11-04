import express from 'express';
import { userController } from '../controllers/userController';

const router = express.Router();

/**
 * POST /api/users/connect
 * Validates wallet address and logs connection timestamp
 */
router.post('/connect', userController.connect);

/**
 * POST /api/users/disconnect
 * Marks a user as disconnected
 */
router.post('/disconnect', userController.disconnect);

/**
 * POST /api/users/heartbeat
 * Updates the user's lastSeen timestamp to keep them online
 */
router.post('/heartbeat', userController.heartbeat);

export { router as userRoutes };
