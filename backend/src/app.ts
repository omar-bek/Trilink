import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { auditMiddleware } from './middlewares/audit.middleware';
import { setupSwagger } from './config/swagger';
import routes from './routes';

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

  // Cookie parsing middleware (must be before body parsing for httpOnly cookies)
  app.use(cookieParser());

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging middleware
  if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'TriLink API is running',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    });
  });

  // Swagger UI documentation (only in development or if explicitly enabled)
  if (config.nodeEnv === 'development' || process.env.ENABLE_SWAGGER === 'true') {
    setupSwagger(app);
  }

  // Audit middleware (after authentication middleware will be applied in routes)
  // Note: Audit middleware should be applied after routes setup, but we'll handle it in routes

  // API routes
  app.use('/api', routes);

  // Error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
