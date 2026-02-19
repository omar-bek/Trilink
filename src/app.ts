import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { generalRateLimiter } from './middlewares/rateLimit.middleware';
import { requestIdMiddleware } from './utils/requestId';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import routes from './routes';
import { logger } from './utils/logger';

/**
 * Create and configure Express application
 */
export const createApp = (): Express => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request ID middleware
  app.use(requestIdMiddleware);

  // Rate limiting
  app.use(generalRateLimiter);

  // API routes
  app.use('/api', routes);

  // Error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  logger.info('Express application configured');

  return app;
};
