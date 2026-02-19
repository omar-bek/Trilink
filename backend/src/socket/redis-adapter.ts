import { Server } from 'socket.io';
import { logger } from '../utils/logger';

/**
 * Setup Redis adapter for Socket.io multi-server scaling
 * This allows Socket.io to work across multiple server instances
 * 
 * Note: Redis adapter requires @socket.io/redis-adapter package
 * For Socket.io v4+, use the redis package adapter
 */
export const setupRedisAdapter = async (io: Server): Promise<boolean> => {
  try {
    // Check if Redis URL is configured
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    if (!redisUrl || redisUrl === 'redis://localhost:6379') {
      logger.warn('Redis URL not configured - Socket.io will run in single-server mode');
      return false;
    }

    // Try to use Redis adapter (optional dependency)
    try {
      // For Socket.io v4+, use @socket.io/redis-adapter with redis package
      const { createAdapter } = await import('@socket.io/redis-adapter');
      const { createClient } = await import('redis');

      // Create Redis pub/sub clients for Socket.io adapter
      const pubClient = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis pub client reconnection failed after 10 retries');
              return new Error('Redis reconnection limit exceeded');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      const subClient = pubClient.duplicate();

      // Handle connection events
      pubClient.on('error', (err) => {
        logger.error('Redis Pub Client Error:', err);
      });

      subClient.on('error', (err) => {
        logger.error('Redis Sub Client Error:', err);
      });

      pubClient.on('connect', () => {
        logger.info('✅ Redis Pub Client connected for Socket.io');
      });

      subClient.on('connect', () => {
        logger.info('✅ Redis Sub Client connected for Socket.io');
      });

      // Connect clients
      await Promise.all([pubClient.connect(), subClient.connect()]);

      // Setup Socket.io Redis adapter
      io.adapter(createAdapter(pubClient, subClient));

      logger.info('✅ Socket.io Redis adapter configured for multi-server scaling');
      return true;
    } catch (importError) {
      logger.warn('Redis adapter package not available - install @socket.io/redis-adapter for multi-server scaling');
      logger.debug('Import error:', importError);
      return false;
    }
  } catch (error) {
    logger.error('Failed to setup Redis adapter for Socket.io:', error);
    logger.warn('Socket.io will run in single-server mode (no scaling)');
    return false;
  }
};

/**
 * Close Redis adapter connections
 */
export const closeRedisAdapter = async (): Promise<void> => {
  // Note: The adapter manages its own connections
  // This is a placeholder for cleanup if needed
  logger.info('Redis adapter connections closed');
};
