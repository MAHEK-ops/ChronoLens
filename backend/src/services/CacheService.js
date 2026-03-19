const { redisClient } = require('../db/redis');

class CacheService {
  /**
   * Generates a valid Redis Cache Key for map coordinates
   * Rounds lat/lng to 4 decimal places.
   */
  static buildKey(lat, lng, radiusKm) {
    const rLat = Number(lat).toFixed(4);
    const rLng = Number(lng).toFixed(4);
    return `timeline:${rLat}:${rLng}:${radiusKm}`;
  }

  /**
   * Parses and Retrieves JSON values by key
   * Returns null if cache is offline or key missing.
   */
  static async get(key) {
    try {
      if (!redisClient.isOpen) return null;
      const cached = await redisClient.get(key);
      if (!cached) return null;
      return JSON.parse(cached);
    } catch (err) {
      console.error(`🔴 Cache GET error for key [${key}]:`, err.message);
      return null;
    }
  }

  /**
   * Set JSON string in cache respecting TTL
   * Default EX: 3600 seconds (1 hr)
   */
  static async set(key, value, ttlSeconds = 3600) {
    try {
      if (!redisClient.isOpen) return false;
      const start = Date.now();
      await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
      const ms = Date.now() - start;
      console.log(`✅ Cached timeline to Redis: ${key} in ${ms}ms`);
      return true;
    } catch (err) {
      console.error(`🔴 Cache SET error for key [${key}]:`, err.message);
      return false;
    }
  }

  /**
   * Forcibly purge a specific cache key
   */
  static async evict(key) {
    try {
      if (!redisClient.isOpen) return false;
      await redisClient.del(key);
      return true;
    } catch (err) {
      console.error(`🔴 Cache EVICT error for key [${key}]:`, err.message);
      return false;
    }
  }

  /**
   * Checks if key exists inside Redis
   */
  static async exists(key) {
    try {
      if (!redisClient.isOpen) return false;
      const count = await redisClient.exists(key);
      return count === 1;
    } catch (err) {
      console.error(`🔴 Cache EXISTS error for key [${key}]:`, err.message);
      return false;
    }
  }
}

module.exports = CacheService;
