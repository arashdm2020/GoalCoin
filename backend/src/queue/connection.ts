/**
 * Redis connection for BullMQ
 */

import { ConnectionOptions } from 'bullmq';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// For Render.com or external Redis URLs
if (REDIS_URL.startsWith('redis://') || REDIS_URL.startsWith('rediss://')) {
  const url = new URL(REDIS_URL);
  redisConnection.host = url.hostname;
  redisConnection.port = parseInt(url.port || '6379');
  if (url.password) {
    redisConnection.password = url.password;
  }
  if (url.protocol === 'rediss:') {
    redisConnection.tls = {};
  }
}

export default redisConnection;
