/**
 * BullMQ Queue Definitions
 * Queues: email, xp-events, webhooks, notifications
 */

import { Queue, QueueOptions } from 'bullmq';
import redisConnection from './connection';

const defaultQueueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 3600, // 24 hours
    },
    removeOnFail: {
      count: 500,
      age: 7 * 24 * 3600, // 7 days
    },
  },
};

// Email Queue
export const emailQueue = new Queue('email', {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    attempts: 5, // More retries for emails
  },
});

// XP Events Queue
export const xpEventsQueue = new Queue('xp-events', defaultQueueOptions);

// Webhooks Queue
export const webhooksQueue = new Queue('webhooks', {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

// Notifications Queue
export const notificationsQueue = new Queue('notifications', defaultQueueOptions);

// Export all queues
export const queues = {
  email: emailQueue,
  xpEvents: xpEventsQueue,
  webhooks: webhooksQueue,
  notifications: notificationsQueue,
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Closing queues...');
  await Promise.all([
    emailQueue.close(),
    xpEventsQueue.close(),
    webhooksQueue.close(),
    notificationsQueue.close(),
  ]);
});
