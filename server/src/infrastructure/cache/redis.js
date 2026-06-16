import logger from '../../shared/logger/logger.js';

class InMemoryCache {
  constructor() {
    this.store = new Map();
    this.rateLimits = new Map();
    logger.info("Initialized memory-fallback Cache layer.");
  }

  async get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiry && entry.expiry < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key, value, ttlSeconds = null) {
    const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null;
    this.store.set(key, { value, expiry });
    return true;
  }

  async del(key) {
    return this.store.delete(key);
  }

  async flush() {
    this.store.clear();
    this.rateLimits.clear();
    return true;
  }

  async slidingWindowRateLimit(key, limit, windowSeconds) {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    
    if (!this.rateLimits.has(key)) {
      this.rateLimits.set(key, []);
    }
    
    let timestamps = this.rateLimits.get(key);
    // Filter timestamps within the sliding window
    timestamps = timestamps.filter(ts => now - ts < windowMs);
    
    if (timestamps.length >= limit) {
      this.rateLimits.set(key, timestamps);
      return { allowed: false, remaining: 0, resetMs: windowMs - (now - timestamps[0]) };
    }
    
    timestamps.push(now);
    this.rateLimits.set(key, timestamps);
    return { 
      allowed: true, 
      remaining: limit - timestamps.length, 
      resetMs: windowMs 
    };
  }
}

class CacheService {
  constructor() {
    this.client = null;
    this.isRedis = false;
    this.fallback = new InMemoryCache();
  }

  async connect() {
    const redisUri = process.env.REDIS_URL || process.env.REDIS_HOST;
    if (!redisUri) {
      logger.info("No REDIS_URL/REDIS_HOST provided. Operating in local in-memory cache mode.");
      return;
    }

    try {
      // Dynamic import to prevent startup crash if ioredis is not installed
      const { default: Redis } = await import('ioredis');
      this.client = new Redis(redisUri, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000
      });

      this.client.on('error', (err) => {
        logger.warn("Redis client error. Cache operations will temporarily fallback to memory.", { error: err.message });
        this.isRedis = false;
      });

      this.client.on('connect', () => {
        logger.info("Successfully connected to Redis Cache cluster.");
        this.isRedis = true;
      });
      
      // Wait briefly for connection
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          logger.warn("Redis connection timeout. Falling back to memory cache.");
          resolve();
        }, 1500);
        this.client.once('ready', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    } catch (err) {
      logger.warn("Could not load 'ioredis' driver or connect to Redis. Running cache in-memory.", { error: err.message });
      this.isRedis = false;
      this.client = null;
    }
  }

  async get(key) {
    if (this.isRedis && this.client) {
      try {
        const val = await this.client.get(key);
        return val ? JSON.parse(val) : null;
      } catch (err) {
        logger.error(`Redis get failed for key: ${key}, calling fallback`, err);
        return this.fallback.get(key);
      }
    }
    return this.fallback.get(key);
  }

  async set(key, value, ttlSeconds = null) {
    if (this.isRedis && this.client) {
      try {
        const valStr = JSON.stringify(value);
        if (ttlSeconds) {
          await this.client.set(key, valStr, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, valStr);
        }
        return true;
      } catch (err) {
        logger.error(`Redis set failed for key: ${key}, calling fallback`, err);
        return this.fallback.set(key, value, ttlSeconds);
      }
    }
    return this.fallback.set(key, value, ttlSeconds);
  }

  async del(key) {
    if (this.isRedis && this.client) {
      try {
        await this.client.del(key);
        return true;
      } catch (err) {
        logger.error(`Redis del failed for key: ${key}, calling fallback`, err);
        return this.fallback.del(key);
      }
    }
    return this.fallback.del(key);
  }

  async slidingWindowRateLimit(key, limit, windowSeconds) {
    if (this.isRedis && this.client) {
      try {
        const now = Date.now();
        const clearBefore = now - (windowSeconds * 1000);
        
        // Multi/Exec pipeline to prune old tokens and insert current
        const tx = this.client.multi();
        tx.zremrangebyscore(key, 0, clearBefore);
        tx.zcard(key);
        tx.zadd(key, now, `${now}-${Math.random()}`);
        tx.zrange(key, 0, 0); // Get oldest remaining entry to calculate reset
        tx.expire(key, windowSeconds);
        
        const results = await tx.exec();
        const count = results[1][1];
        const oldestEntry = results[3][1];
        
        if (count >= limit) {
          // Remove the entry we just added to keep size constant
          await this.client.zremrangebyscore(key, now, now);
          const oldestTime = parseFloat(oldestEntry[0].split('-')[0]);
          const resetMs = (windowSeconds * 1000) - (now - oldestTime);
          return { allowed: false, remaining: 0, resetMs };
        }
        
        return { 
          allowed: true, 
          remaining: limit - count - 1, 
          resetMs: windowSeconds * 1000 
        };
      } catch (err) {
        logger.error(`Redis rate limit failed for key: ${key}, calling fallback`, err);
        return this.fallback.slidingWindowRateLimit(key, limit, windowSeconds);
      }
    }
    return this.fallback.slidingWindowRateLimit(key, limit, windowSeconds);
  }
}

const cache = new CacheService();
cache.connect().catch((err) => logger.error("Cache initialization failed:", err));

export default cache;
