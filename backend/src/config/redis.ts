import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

let redisClient: RedisClientType | null = null;
let lastErrorLogTime = 0;
const ERROR_LOG_THROTTLE = 30000; // Only log errors once per 30 seconds
let hasLoggedInitialError = false;

/**
 * Initialize Redis client
 */
import { config } from './env';

export const initRedis = async (): Promise<void> => {
  try {
    const redisUrl = config.redis.url;
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            // Stop reconnecting after 3 attempts
            const now = Date.now();
            if (now - lastErrorLogTime > ERROR_LOG_THROTTLE) {
              logger.warn('Redis reconnection failed after 3 attempts. Caching disabled until Redis is available.');
              lastErrorLogTime = now;
            }
            return new Error('Redis reconnection limit exceeded');
          }
          return Math.min(retries * 100, 1000);
        },
      },
    });

    redisClient.on('error', (_err) => {
      // Throttle error logging
      const now = Date.now();
      if (now - lastErrorLogTime > ERROR_LOG_THROTTLE) {
        logger.warn('Redis Client Error. Caching may be unavailable.');
        lastErrorLogTime = now;
      }
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected');
      hasLoggedInitialError = false;
    });

    redisClient.on('disconnect', () => {
      logger.warn('⚠️  Redis disconnected');
    });

    await redisClient.connect();
  } catch (error) {
    // Only log initial connection error once
    if (!hasLoggedInitialError) {
      logger.warn('Failed to connect to Redis. Caching disabled. The application will continue without Redis.');
      hasLoggedInitialError = true;
    }
    // Continue without Redis - cache will be disabled
    redisClient = null;
  }
};

/**
 * Get Redis client instance
 */
export const getRedisClient = (): RedisClientType | null => {
  return redisClient;
};

/**
 * Close Redis connection
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('✅ Redis disconnected');
  }
};

/**
 * Check if Redis is available
 */
export const isRedisAvailable = (): boolean => {
  return redisClient !== null && redisClient.isOpen;
};
