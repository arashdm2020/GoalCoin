/**
 * Cache Service - Redis wrapper for leaderboards and profiles
 */

class CacheService {
  private enabled: boolean;
  private redis: any;
  private defaultTTL = 180; // 3 minutes

  constructor() {
    this.enabled = process.env.REDIS_URL ? true : false;
    
    if (this.enabled) {
      try {
        const { redis } = require('../config/redis');
        this.redis = redis;
      } catch (error) {
        console.warn('Redis not available, caching disabled');
        this.enabled = false;
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.redis) return null;

    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.enabled || !this.redis) return;

    try {
      await this.redis.setex(
        key,
        ttl || this.defaultTTL,
        JSON.stringify(value)
      );
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.enabled || !this.redis) return;

    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache del error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.enabled || !this.redis) return;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }

  async cached<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }

  async getStats(): Promise<any> {
    if (!this.enabled || !this.redis) {
      return { enabled: false };
    }

    try {
      const info = await this.redis.info('stats');
      const hits = parseInt(info.match(/keyspace_hits:(\d+)/)?.[1] || '0');
      const misses = parseInt(info.match(/keyspace_misses:(\d+)/)?.[1] || '0');
      const hitRate = hits / (hits + misses) || 0;

      return {
        enabled: true,
        hits,
        misses,
        hitRate: (hitRate * 100).toFixed(2) + '%'
      };
    } catch (error) {
      return { enabled: true, error: 'Failed to get stats' };
    }
  }
}

export const cacheService = new CacheService();
