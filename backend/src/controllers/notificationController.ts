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

      console.log('[NOTIFICATIONS] Fetching for user:', userId, 'unreadOnly:', unreadOnly, 'limit:', limit);

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Use raw SQL to avoid Prisma schema issues
      let query = `
        SELECT id, user_id, type, title, message, read, metadata, created_at
        FROM notifications
        WHERE user_id = $1
      `;
      const params: any[] = [userId];

      if (unreadOnly) {
        query += ` AND read = false`;
      }

      query += ` ORDER BY created_at DESC LIMIT $2`;
      params.push(limit);

      const notifications = await prisma.$queryRawUnsafe(query, ...params);

      console.log('[NOTIFICATIONS] Found:', (notifications as any[]).length, 'notifications');

      res.json({ success: true, notifications });
    } catch (error) {
      console.error('[NOTIFICATIONS] Error fetching notifications:', error);
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

      // Use raw SQL to avoid Prisma schema issues
      const result = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int as count FROM notifications WHERE user_id = $1 AND read = false`,
        userId
      ) as any[];

      const count = result[0]?.count || 0;

      res.json({ success: true, count });
    } catch (error) {
      console.error('[NOTIFICATIONS] Error fetching unread count:', error);
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

      // Use raw SQL to avoid Prisma schema issues
      const result = await prisma.$executeRawUnsafe(
        `UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2`,
        id,
        userId
      );

      if (result === 0) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      console.error('[NOTIFICATIONS] Error marking notification as read:', error);
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

      // Use raw SQL to avoid Prisma schema issues
      await prisma.$executeRawUnsafe(
        `UPDATE notifications SET read = true WHERE user_id = $1 AND read = false`,
        userId
      );

      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      console.error('[NOTIFICATIONS] Error marking all notifications as read:', error);
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
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
      const notificationId = `not_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Use raw SQL to avoid Prisma schema issues
      await prisma.$executeRawUnsafe(
        `INSERT INTO notifications (id, user_id, type, title, message, read, metadata, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
        notificationId,
        data.user_id,
        data.type,
        data.title,
        data.message,
        false,
        JSON.stringify(data.metadata || {})
      );
    } catch (error) {
      console.error('[NOTIFICATIONS] Error creating notification:', error);
    }
  },

  /**
   * POST /api/notifications/test-create
   * Test endpoint to create a notification for debugging
   */
  async testCreateNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      console.log('[NOTIFICATIONS] Test creating notification for user:', userId);

      const notificationId = `not_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await prisma.$executeRawUnsafe(
        `INSERT INTO notifications (id, user_id, type, title, message, read, metadata, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
        notificationId,
        userId,
        'TEST',
        '🧪 Test Notification',
        'This is a test notification to verify the system is working.',
        false,
        JSON.stringify({ test: true, timestamp: new Date().toISOString() })
      );

      console.log('[NOTIFICATIONS] ✅ Test notification created:', notificationId);

      res.json({ 
        success: true, 
        message: 'Test notification created',
        notificationId,
        userId
      });
    } catch (error) {
      console.error('[NOTIFICATIONS] ❌ Error creating test notification:', error);
      console.error('[NOTIFICATIONS] Error details:', {
        message: (error as any).message,
        code: (error as any).code,
        detail: (error as any).detail
      });
      res.status(500).json({ 
        error: 'Failed to create test notification',
        details: (error as any).message
      });
    }
  },
};

export default notificationController;
