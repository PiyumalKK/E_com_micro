const Redis = require('ioredis');

let redis = null;
const DEFAULT_TTL = 300; // 5 minutes

async function initRedis() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.log('REDIS_URL not set, caching disabled');
    return false;
  }

  try {
    redis = new Redis(redisUrl, {
      tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3
    });

    await new Promise((resolve, reject) => {
      redis.on('connect', () => {
        console.log('Redis Cache connected');
        resolve();
      });
      redis.on('error', (err) => {
        console.error('Redis error:', err.message);
        reject(err);
      });
      setTimeout(() => reject(new Error('Redis connection timeout')), 10000);
    });

    return true;
  } catch (err) {
    console.error('Redis initialization failed:', err.message);
    redis = null;
    return false;
  }
}

function isCacheEnabled() {
  return redis !== null && redis.status === 'ready';
}

async function getCache(key) {
  if (!isCacheEnabled()) return null;
  try {
    const data = await redis.get(key);
    if (data) console.log(`[Cache] HIT: ${key}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

async function setCache(key, data, ttl = DEFAULT_TTL) {
  if (!isCacheEnabled()) return;
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
    console.log(`[Cache] SET: ${key} (TTL: ${ttl}s)`);
  } catch { /* ignore cache write failures */ }
}

async function invalidateCache(pattern) {
  if (!isCacheEnabled()) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`[Cache] INVALIDATED: ${keys.length} keys matching ${pattern}`);
    }
  } catch { /* ignore */ }
}

async function closeRedis() {
  if (redis) await redis.quit();
}

module.exports = { initRedis, isCacheEnabled, getCache, setCache, invalidateCache, closeRedis };
