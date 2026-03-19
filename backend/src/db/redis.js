const { createClient } = require('redis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
  url: redisUrl,
  socket: {
    // Retry strategy ensures node won't get stuck rapidly failing connections
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        console.warn('Redis reconnection failed too many times. Continuing without cache.');
        return new Error('Max retries reached');
      }
      return Math.min(retries * 50, 2000);
    }
  }
});

// Important: adding an error listener prevents Node from crashing on unhandled socket errors
redisClient.on('error', (err) => {
  console.error('Redis client error event:', err.message);
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully.');
});

let isConnecting = false;

const connectRedis = async () => {
  if (!redisClient.isOpen && !isConnecting) {
    isConnecting = true;
    try {
      await redisClient.connect();
    } catch (err) {
      console.error('❌ Failed to connect to Redis on startup. Cache will be bypassed.', err.message);
    } finally {
      isConnecting = false;
    }
  }
};

module.exports = {
  redisClient,
  connectRedis
};
