/**
 * Webhooks Worker - Processes webhook events
 */

import { Worker, Job } from 'bullmq';
import redisConnection from '../connection';

interface WebhookJob {
  source: 'coinpayments' | 'shopify' | 'other';
  event: string;
  payload: Record<string, any>;
  signature?: string;
}

const webhooksWorker = new Worker(
  'webhooks',
  async (job: Job<WebhookJob>) => {
    const { source, event, payload, signature } = job.data;

    console.log(`[Webhook Worker] Processing: ${source} - ${event}`);

    try {
      // Route to appropriate handler
      switch (source) {
        case 'coinpayments':
          // TODO: Process CoinPayments webhook
          console.log('[Webhook] CoinPayments event:', event);
          break;

        case 'shopify':
          // TODO: Process Shopify webhook
          console.log('[Webhook] Shopify event:', event);
          break;

        default:
          console.log('[Webhook] Unknown source:', source);
      }

      return { success: true, processed: true };
    } catch (error: any) {
      console.error(`[Webhook Worker] Error:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 3,
    limiter: {
      max: 20,
      duration: 1000, // 20 webhooks per second
    },
  }
);

webhooksWorker.on('completed', (job) => {
  console.log(`[Webhook Worker] ✅ Job ${job.id} completed`);
});

webhooksWorker.on('failed', (job, err) => {
  console.error(`[Webhook Worker] ❌ Job ${job?.id} failed:`, err.message);
});

export default webhooksWorker;
