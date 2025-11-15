const Redis = require('ioredis');

// New Redis URL
const NEW_REDIS_URL = 'rediss://default:AXiHAAIncDJhMjI1ZmE0NjEwYzE0YWE1YTE2MGE4NjlhYmY1NjUyMHAyMzA4NTU@cute-grizzly-30855.upstash.io:6379';

async function testNewRedis() {
  const redis = new Redis(NEW_REDIS_URL, {
    tls: {
      rejectUnauthorized: false
    },
    maxRetriesPerRequest: 3
  });

  try {
    console.log('🔌 Connecting to NEW Redis...');
    console.log('URL: cute-grizzly-30855.upstash.io:6379\n');
    
    // Test connection
    const pong = await redis.ping();
    console.log('✅ Connection successful! PING:', pong);

    // Get database info
    console.log('\n📊 DATABASE INFO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const dbsize = await redis.dbsize();
    console.log(`Total Keys: ${dbsize}`);

    // Get memory info
    const info = await redis.info('memory');
    const usedMemory = info.match(/used_memory_human:(.+)/)?.[1]?.trim();
    console.log(`Memory Used: ${usedMemory || 'N/A'}`);

    // Test write
    console.log('\n🧪 TESTING OPERATIONS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    await redis.set('test:goalcoin', 'Hello from GoalCoin!', 'EX', 60);
    console.log('✅ SET test:goalcoin');
    
    const value = await redis.get('test:goalcoin');
    console.log(`✅ GET test:goalcoin: ${value}`);
    
    await redis.del('test:goalcoin');
    console.log('✅ DEL test:goalcoin');

    // Test cache pattern
    console.log('\n📦 TESTING CACHE PATTERN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const cacheKey = 'leaderboard:test';
    const cacheData = { users: ['user1', 'user2'], timestamp: Date.now() };
    
    await redis.setex(cacheKey, 180, JSON.stringify(cacheData));
    console.log('✅ Cached leaderboard data (TTL: 180s)');
    
    const cached = await redis.get(cacheKey);
    const parsed = JSON.parse(cached);
    console.log(`✅ Retrieved cached data:`, parsed);
    
    await redis.del(cacheKey);
    console.log('✅ Cleaned up test data');

    console.log('\n✅ All tests passed! Redis is ready to use.');
    console.log('\n📋 NEXT STEPS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Go to Render Dashboard');
    console.log('2. Add environment variable:');
    console.log('   REDIS_URL=rediss://default:AXiHAAIncDJhMjI1ZmE0NjEwYzE0YWE1YTE2MGE4NjlhYmY1NjUyMHAyMzA4NTU@cute-grizzly-30855.upstash.io:6379');
    console.log('3. Restart the service');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await redis.quit();
    console.log('\n🔌 Connection closed');
  }
}

testNewRedis();
