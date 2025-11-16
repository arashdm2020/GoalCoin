import express from 'express';
import { notificationController } from '../controllers/notificationController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/notifications
 * Get user's notifications
 */
router.get('/', notificationController.getUserNotifications);

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * POST /api/notifications/:id/read
 * Mark notification as read
 */
router.post('/:id/read', notificationController.markAsRead);

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read
 */
router.post('/read-all', notificationController.markAllAsRead);

export default router;
