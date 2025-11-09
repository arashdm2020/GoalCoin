import express from 'express';
import { userController } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

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

/**
 * PATCH /api/users/profile
 * Update user profile (handle, country_code)
 */
router.patch('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { handle, country_code } = req.body;

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(handle && { handle }),
        ...(country_code && { country_code }),
      },
    });

    res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export { router as userRoutes };
