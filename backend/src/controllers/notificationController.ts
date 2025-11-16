import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const notificationController = {
  /**
   * GET /api/notifications
   * Get user's notifications
   */
  async getUserNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const unreadOnly = req.query.unread === 'true';

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const notifications = await prisma.notification.findMany({
        where: {
          user_id: userId,
          ...(unreadOnly ? { read: false } : {}),
        },
        orderBy: { created_at: 'desc' },
        take: limit,
      });

      res.json({ success: true, notifications });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  },

  /**
   * GET /api/notifications/unread-count
   * Get count of unread notifications
   */
  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const count = await prisma.notification.count({
        where: {
          user_id: userId,
          read: false,
        },
      });

      res.json({ success: true, count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ error: 'Failed to fetch unread count' });
    }
  },

  /**
   * POST /api/notifications/:id/read
   * Mark notification as read
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Verify notification belongs to user
      const notification = await prisma.notification.findFirst({
        where: { id, user_id: userId },
      });

      if (!notification) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      await prisma.notification.update({
        where: { id },
        data: { read: true },
      });

      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  },

  /**
   * POST /api/notifications/read-all
   * Mark all notifications as read
   */
  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      await prisma.notification.updateMany({
        where: {
          user_id: userId,
          read: false,
        },
        data: { read: true },
      });

      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking all as read:', error);
      res.status(500).json({ error: 'Failed to mark all as read' });
    }
  },

  /**
   * Helper: Create notification
   */
  async createNotification(data: {
    user_id: string;
    type: string;
    title: string;
    message: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          user_id: data.user_id,
          type: data.type,
          title: data.title,
          message: data.message,
          metadata: data.metadata || {},
        },
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  },
};

export default notificationController;
