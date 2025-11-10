/**
 * Workers Index - Start all workers
 */

import emailWorker from './emailWorker';
import xpEventsWorker from './xpEventsWorker';
import webhooksWorker from './webhooksWorker';
import notificationsWorker from './notificationsWorker';

console.log('🚀 Starting BullMQ workers...');

export const workers = {
  email: emailWorker,
  xpEvents: xpEventsWorker,
  webhooks: webhooksWorker,
  notifications: notificationsWorker,
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Closing workers...');
  await Promise.all([
    emailWorker.close(),
    xpEventsWorker.close(),
    webhooksWorker.close(),
    notificationsWorker.close(),
  ]);
  process.exit(0);
});

console.log('✅ All workers started');

export default workers;
