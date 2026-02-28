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

const startServer = async (): Promise<void> => {
  try {
    logger.info('Loading secrets...');
    const secretsManager = getSecretsManager();
    await secretsManager.loadSecrets();
    logger.info('✅ Secrets loaded and validated');

    await connectDatabase();

    await initRedis();

    const app = createApp();
    const httpServer = createServer(app);

    const io = new SocketIOServer(httpServer, {
      cors: { origin: config.cors.origin, credentials: true },
      path: '/socket.io',
      connectTimeout: 45000,
      pingTimeout: 20000,
      pingInterval: 25000,
    });

    const redisAdapterEnabled = await setupRedisAdapter(io);
    if (!redisAdapterEnabled) logger.warn('Socket.io running without Redis adapter');

    const connectionLimits: ConnectionLimits = {
      maxConnectionsPerUser: config.socket.maxConnectionsPerUser,
      maxConnectionsPerCompany: config.socket.maxConnectionsPerCompany,
      maxConnectionsPerIP: config.socket.maxConnectionsPerIP,
    };

    setupSocketIO(io, connectionLimits);
    initializeSocketService(io);
    notificationScheduler.start();

    httpServer.listen(config.port, () => {
      console.log(`🚀 TriLink API server running on port ${config.port}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${config.port}/health`);
      console.log(`🔌 Socket.io ready`);
    });

    // Handle server errors
    httpServer.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use`);
        console.error(`❌ Port ${config.port} is already in use`);
        process.exit(1);
      } else {
        logger.error('HTTP Server error:', error);
        console.error('HTTP Server error:', error);
      }
    });

    // ===== Graceful Shutdown =====
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down...`);
      notificationScheduler.stop();
      await closeRedis();
      io.close();
      httpServer.close(async () => {
        await disconnectDatabase();
        console.log('✅ Shutdown complete');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
      console.error('Unhandled Rejection:', reason);
      gracefulShutdown('unhandledRejection');
    });
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      console.error('Uncaught Exception:', error);
      console.error('Error stack:', error.stack);
      gracefulShutdown('uncaughtException');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();