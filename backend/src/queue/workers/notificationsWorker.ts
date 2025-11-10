/**
 * Notifications Worker - Processes notification events
 */

import { Worker, Job } from 'bullmq';
import redisConnection from '../connection';

interface NotificationJob {
  userId: string;
  type: 'tier-upgrade' | 'streak-milestone' | 'challenge-reminder' | 'burn-event';
  title: string;
  message: string;
  data?: Record<string, any>;
}

const notificationsWorker = new Worker(
  'notifications',
  async (job: Job<NotificationJob>) => {
    const { userId, type, title, message, data } = job.data;

    console.log(`[Notification Worker] Processing: ${type} for user ${userId}`);

    try {
      // TODO: Implement notification delivery
      // Options: Push notifications, in-app notifications, SMS, etc.
      console.log(`[Notification] User: ${userId}`);
      console.log(`[Notification] Type: ${type}`);
      console.log(`[Notification] Title: ${title}`);
      console.log(`[Notification] Message: ${message}`);

      // For now, just log
      // Later: Store in database, send push notification, etc.

      return { success: true, delivered: true };
    } catch (error: any) {
      console.error(`[Notification Worker] Error:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 10,
    limiter: {
      max: 30,
      duration: 1000, // 30 notifications per second
    },
  }
);

notificationsWorker.on('completed', (job) => {
  console.log(`[Notification Worker] ✅ Job ${job.id} completed`);
});

notificationsWorker.on('failed', (job, err) => {
  console.error(`[Notification Worker] ❌ Job ${job?.id} failed:`, err.message);
});

export default notificationsWorker;
