const Redis = require('ioredis');

// Old Redis URL
const REDIS_URL = 'redis://default:AYsMAAIncDI5OTQ1MzA2MzVlMTQ0ZjNiYTc4YTQxN2E4NmUzYmE0OXAyMzU1OTY@romantic-weevil-35596.upstash.io:6379';

async function clearRedis() {
  const redis = new Redis(REDIS_URL, {
    tls: {
      rejectUnauthorized: false
    },
    maxRetriesPerRequest: 3
  });

  try {
    console.log('🔌 Connecting to Redis...');
    
    // Get all keys
    const keys = await redis.keys('*');
    console.log(`📊 Found ${keys.length} keys in Redis`);

    if (keys.length === 0) {
      console.log('✅ Redis is already empty');
      return;
    }

    // Show some sample keys
    console.log('\n📝 Sample keys:');
    keys.slice(0, 10).forEach(key => console.log(`  - ${key}`));
    if (keys.length > 10) {
      console.log(`  ... and ${keys.length - 10} more`);
    }

    // Get memory usage
    const info = await redis.info('memory');
    const usedMemory = info.match(/used_memory_human:(.+)/)?.[1]?.trim();
    console.log(`\n💾 Memory used: ${usedMemory}`);

    console.log('\n⚠️  To delete all keys, uncomment the FLUSHALL command in the script');
    console.log('⚠️  WARNING: This will delete ALL data in Redis!');
    
    // Uncomment the line below to actually delete all keys
    // await redis.flushall();
    // console.log('✅ All keys deleted!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await redis.quit();
    console.log('🔌 Redis connection closed');
  }
}

clearRedis();
