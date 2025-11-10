/**
 * Email Worker - Processes email jobs
 */

import { Worker, Job } from 'bullmq';
import redisConnection from '../connection';
import { emailService } from '../../services/emailService';

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
      let result;

      switch (template) {
        case 'verification':
          result = await emailService.sendVerificationEmail(to, data.token);
          break;

        case 'password-reset':
          result = await emailService.sendPasswordResetEmail(to, data.token);
          break;

        case 'weekly-digest':
          result = await emailService.sendWeeklyDigest(to, data);
          break;

        case 'admin-alert':
          result = await emailService.sendAdminAlert(to, data);
          break;

        default:
          throw new Error(`Unknown email template: ${template}`);
      }

      console.log(`[Email Worker] ✅ Sent ${template} to ${to}`);
      return result;
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
