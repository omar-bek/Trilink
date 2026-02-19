import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { initRedis, closeRedis } from './config/redis';
import { config } from './config/env';
import { setupSocketIO } from './socket/socket';
import { initializeSocketService } from './socket/socket.service';
import { notificationScheduler } from './modules/notifications/scheduler';
import { setupRedisAdapter } from './socket/redis-adapter';
import { ConnectionLimits } from './socket/connection-manager';
import { logger } from './utils/logger';
import { getSecretsManager } from './utils/secrets-manager.service';

/**
 * Initialize and start the server
 */
const startServer = async (): Promise<void> => {
  try {
    // Load and validate secrets FIRST (before any other initialization)
    logger.info('Loading secrets...');
    const secretsManager = getSecretsManager();
    await secretsManager.loadSecrets();
    logger.info('✅ Secrets loaded and validated');

    // Connect to database
    await connectDatabase();

    // Configure database security indexes
    const { configureDatabaseSecurity } = await import('./config/database-security');
    await configureDatabaseSecurity();

    // Create category routing indexes (CRITICAL for performance)
    const { createCategoryRoutingIndexes } = await import('./config/database-indexes');
    await createCategoryRoutingIndexes();

    // Initialize Redis (optional, continues if unavailable)
    await initRedis();

    // Initialize category routing event handlers and queue service
    const { initializeCategoryRoutingEventHandlers } = await import('./modules/category-routing/event-handlers');
    const { CategoryRoutingQueueService } = await import('./modules/category-routing/queue.service');
    initializeCategoryRoutingEventHandlers();
    const routingQueueService = new CategoryRoutingQueueService();
    await routingQueueService.initialize();

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.io
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.cors.origin,
        credentials: true,
      },
      path: '/socket.io',
      // Connection timeout settings
      connectTimeout: 45000,
      pingTimeout: 20000,
      pingInterval: 25000,
    });

    // Setup Redis adapter for multi-server scaling (optional)
    const redisAdapterEnabled = await setupRedisAdapter(io);
    if (!redisAdapterEnabled) {
      logger.warn('Socket.io running without Redis adapter - single server mode only');
    }

    // Configure connection limits
    const connectionLimits: ConnectionLimits = {
      maxConnectionsPerUser: config.socket.maxConnectionsPerUser,
      maxConnectionsPerCompany: config.socket.maxConnectionsPerCompany,
      maxConnectionsPerIP: config.socket.maxConnectionsPerIP,
    };

    // Setup Socket.io handlers with connection limits
    setupSocketIO(io, connectionLimits);

    // Initialize Socket.io service for emitting events
    initializeSocketService(io);

    // Start notification scheduler
    notificationScheduler.start();

    // Start server
    httpServer.listen(config.port, () => {
      console.log(`🚀 TriLink API server running on port ${config.port}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${config.port}/health`);
      console.log(`🔌 Socket.io ready for real-time tracking`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);

      // Stop notification scheduler
      notificationScheduler.stop();

      // Close Redis connection
      await closeRedis();

      // Close Socket.io connections
      io.close(() => {
        console.log('✅ Socket.io closed');
      });

      // Close Redis adapter if enabled
      if (redisAdapterEnabled) {
        try {
          const { closeRedisAdapter } = await import('./socket/redis-adapter');
          await closeRedisAdapter();
        } catch (error) {
          console.error('Error closing Redis adapter:', error);
        }
      }

      httpServer.close(async () => {
        console.log('✅ HTTP server closed');

        try {
          await disconnectDatabase();
          console.log('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
