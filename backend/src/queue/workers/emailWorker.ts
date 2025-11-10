/**
 * Email Worker - Processes email jobs
 */

import { Worker, Job } from 'bullmq';
import redisConnection from '../connection';

interface EmailJob {
  to: string;
  subject: string;
  template: 'verification' | 'password-reset' | 'weekly-digest' | 'admin-alert';
  data: Record<string, any>;
}

const emailWorker = new Worker(
  'email',
  async (job: Job<EmailJob>) => {
    const { to, subject, template, data } = job.data;

    console.log(`[Email Worker] Processing: ${template} to ${to}`);

    try {
      // TODO: Integrate Mailgun
      // For now, just log
      console.log(`[Email] To: ${to}`);
      console.log(`[Email] Subject: ${subject}`);
      console.log(`[Email] Template: ${template}`);
      console.log(`[Email] Data:`, data);

      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1000));

      return { success: true, messageId: `mock-${Date.now()}` };
    } catch (error: any) {
      console.error(`[Email Worker] Error:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000, // 10 emails per second
    },
  }
);

emailWorker.on('completed', (job) => {
  console.log(`[Email Worker] ✅ Job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[Email Worker] ❌ Job ${job?.id} failed:`, err.message);
});

export default emailWorker;
