const Redis = require('ioredis');

// Redis connection for Upstash
const redis = new Redis({
  host: 'romantic-weevil-35596.upstash.io',
  port: 6379,
  username: 'default',
  password: 'AYsMAAIncDI5OTQ1MzA2MzVlMTQ0ZjNiYTc4YTQxN2E4NmUzYmE0OXAyMzU1OTY',
  tls: {
    rejectUnauthorized: false
  },
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});

async function flushRedis() {
  try {
    console.log('🔄 Connecting to Redis...');
    
    // Check connection
    const pong = await redis.ping();
    console.log('✅ Redis connected:', pong);
    
    // Get current memory usage
    const info = await redis.info('memory');
    console.log('📊 Current Redis info:', info);
    
    // Flush all data
    console.log('🗑️ Flushing all Redis data...');
    const result = await redis.flushall();
    console.log('✅ Redis flushed:', result);
    
    // Verify it's empty
    const keys = await redis.keys('*');
    console.log('🔍 Remaining keys:', keys.length);
    
    console.log('🎉 Redis successfully cleared!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    redis.disconnect();
  }
}

flushRedis();
