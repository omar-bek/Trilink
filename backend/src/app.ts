import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { setupSwagger } from './config/swagger';
import routes from './routes';

/**
 * Create and configure Express application
 */
export const createApp = (): Express => {
  const app = express();

  // ===== Security middleware =====
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable CSP for React app
    })
  );
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
    })
  );

  // ===== Cookie parsing =====
  app.use(cookieParser());

  // ===== Body parsing =====
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ===== Logging =====
  if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // ===== Health check endpoint =====
  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'TriLink API is running',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    });
  });

  // ===== Swagger documentation =====
  if (config.nodeEnv === 'development' || process.env.ENABLE_SWAGGER === 'true') {
    setupSwagger(app);
  }

  // ===== API routes =====
  app.use('/api', routes);

  // ===== Frontend static files (React build) =====
  // Serve static files from frontend/dist
  const frontendPath = path.resolve(__dirname, '../../frontend/dist');
  
  // Log frontend path for debugging
  if (config.nodeEnv === 'development') {
    console.log('📁 Frontend path:', frontendPath);
    console.log('📄 Index.html exists:', fs.existsSync(path.join(frontendPath, 'index.html')));
  }
  
  // Serve static assets (JS, CSS, images, etc.)
  app.use(express.static(frontendPath, {
    maxAge: '1y', // Cache static assets for 1 year
    etag: true,
  }));

  // Serve index.html for all non-API routes (SPA fallback)
  // This must be after API routes and static files, but before error handlers
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return next();
    }
    // Skip socket.io
    if (req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });

  // ===== Error handling middleware (must be last) =====
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};