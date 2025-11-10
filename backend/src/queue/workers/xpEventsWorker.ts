/**
 * XP Events Worker - Processes XP award events
 */

import { Worker, Job } from 'bullmq';
import redisConnection from '../connection';
import { xpService } from '../../services/xpService';

interface XPEventJob {
  userId: string;
  actionKey: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}

const xpEventsWorker = new Worker(
  'xp-events',
  async (job: Job<XPEventJob>) => {
    const { userId, actionKey, metadata, idempotencyKey } = job.data;

    console.log(`[XP Worker] Processing: ${actionKey} for user ${userId}`);

    try {
      const result = await xpService.awardXP({
        userId,
        actionKey,
        metadata,
        idempotencyKey: idempotencyKey || `xp-${job.id}`,
      });

      console.log(`[XP Worker] ✅ XP event processed for user ${userId}`);
      return result;
    } catch (error: any) {
      console.error(`[XP Worker] Error:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 10,
    limiter: {
      max: 50,
      duration: 1000, // 50 XP events per second
    },
  }
);

xpEventsWorker.on('completed', (job) => {
  console.log(`[XP Worker] ✅ Job ${job.id} completed`);
});

xpEventsWorker.on('failed', (job, err) => {
  console.error(`[XP Worker] ❌ Job ${job?.id} failed:`, err.message);
});

export default xpEventsWorker;
