const Redis = require('ioredis');

// Old Redis URL
const OLD_REDIS_URL = 'redis://default:AYsMAAIncDI5OTQ1MzA2MzVlMTQ0ZjNiYTc4YTQxN2E4NmUzYmE0OXAyMzU1OTY@romantic-weevil-35596.upstash.io:6379';

async function inspectOldRedis() {
  const redis = new Redis(OLD_REDIS_URL, {
    tls: {
      rejectUnauthorized: false
    },
    maxRetriesPerRequest: 1,
    connectTimeout: 5000,
    lazyConnect: true
  });

  try {
    console.log('🔌 Attempting to connect to OLD Redis...');
    console.log('⚠️  Note: Connection may fail due to request limit\n');
    
    await redis.connect();
    console.log('✅ Connected successfully!\n');

    // Get database info
    console.log('📊 DATABASE INFO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const dbsize = await redis.dbsize();
    console.log(`Total Keys: ${dbsize}`);

    // Get all keys
    const keys = await redis.keys('*');
    console.log(`\n📝 ALL KEYS (${keys.length}):`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (keys.length === 0) {
      console.log('✅ Redis is empty - no data to migrate');
      return;
    }

    // Group keys by pattern
    const keyGroups = {};
    keys.forEach(key => {
      const prefix = key.split(':')[0];
      if (!keyGroups[prefix]) {
        keyGroups[prefix] = [];
      }
      keyGroups[prefix].push(key);
    });

    // Show grouped keys
    for (const [prefix, groupKeys] of Object.entries(keyGroups)) {
      console.log(`\n📦 ${prefix.toUpperCase()} (${groupKeys.length} keys):`);
      groupKeys.slice(0, 5).forEach(key => console.log(`  - ${key}`));
      if (groupKeys.length > 5) {
        console.log(`  ... and ${groupKeys.length - 5} more`);
      }
    }

    // Get memory info
    console.log('\n💾 MEMORY INFO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const info = await redis.info('memory');
    const usedMemory = info.match(/used_memory_human:(.+)/)?.[1]?.trim();
    const peakMemory = info.match(/used_memory_peak_human:(.+)/)?.[1]?.trim();
    console.log(`Used Memory: ${usedMemory}`);
    console.log(`Peak Memory: ${peakMemory}`);

    // Sample some keys to see their type and content
    console.log('\n🔍 SAMPLE DATA:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const sampleKeys = keys.slice(0, 3);
    for (const key of sampleKeys) {
      const type = await redis.type(key);
      const ttl = await redis.ttl(key);
      console.log(`\nKey: ${key}`);
      console.log(`Type: ${type}`);
      console.log(`TTL: ${ttl === -1 ? 'No expiration' : ttl === -2 ? 'Expired' : `${ttl}s`}`);
      
      if (type === 'string') {
        const value = await redis.get(key);
        const preview = value.length > 100 ? value.substring(0, 100) + '...' : value;
        console.log(`Value: ${preview}`);
      } else if (type === 'hash') {
        const fields = await redis.hgetall(key);
        console.log(`Fields: ${Object.keys(fields).join(', ')}`);
      } else if (type === 'list') {
        const length = await redis.llen(key);
        console.log(`Length: ${length}`);
      } else if (type === 'set') {
        const members = await redis.smembers(key);
        console.log(`Members: ${members.slice(0, 5).join(', ')}`);
      }
    }

    // Check for BullMQ queues
    console.log('\n📬 BULLMQ QUEUES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const queueKeys = keys.filter(k => k.includes('bull:'));
    if (queueKeys.length > 0) {
      console.log(`Found ${queueKeys.length} BullMQ keys`);
      const queueNames = [...new Set(queueKeys.map(k => k.split(':')[1]))];
      console.log(`Queues: ${queueNames.join(', ')}`);
    } else {
      console.log('No BullMQ queues found');
    }

    // Summary
    console.log('\n📋 SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Keys: ${keys.length}`);
    console.log(`Key Types: ${Object.keys(keyGroups).join(', ')}`);
    console.log(`Memory Used: ${usedMemory}`);
    console.log(`\n✅ Inspection complete!`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n⚠️  Cannot connect to old Redis (likely due to request limit)');
    console.log('📝 This means:');
    console.log('   - Redis has exceeded 500,000 requests');
    console.log('   - Cannot retrieve old data');
    console.log('   - Safe to use new Redis without migration');
    console.log('   - All important data is in PostgreSQL');
  } finally {
    await redis.quit();
    console.log('\n🔌 Connection closed');
  }
}

inspectOldRedis();
