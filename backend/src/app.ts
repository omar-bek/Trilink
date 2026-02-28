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
import { logger } from './utils/logger';
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
  // Try multiple possible paths for different deployment scenarios
  let frontendPath: string;
  
  // Path 1: From dist/ (production compiled) -> ../frontend/dist
  const path1 = path.resolve(__dirname, '../frontend/dist');
  // Path 2: From dist/ -> ../../frontend/dist (if backend and frontend are siblings)
  const path2 = path.resolve(__dirname, '../../frontend/dist');
  // Path 3: Environment variable override (for production servers)
  const path3 = process.env.FRONTEND_DIST_PATH 
    ? path.resolve(process.env.FRONTEND_DIST_PATH)
    : null;
  
  // Check which path exists
  if (path3 && fs.existsSync(path.join(path3, 'index.html'))) {
    frontendPath = path3;
  } else if (fs.existsSync(path.join(path1, 'index.html'))) {
    frontendPath = path1;
  } else if (fs.existsSync(path.join(path2, 'index.html'))) {
    frontendPath = path2;
  } else {
    // Default to path2 (most common structure)
    frontendPath = path2;
  }
  
  // Log frontend path for debugging
  console.log('📁 Frontend path:', frontendPath);
  console.log('📄 Index.html exists:', fs.existsSync(path.join(frontendPath, 'index.html')));
  
  if (!fs.existsSync(path.join(frontendPath, 'index.html'))) {
    console.warn('⚠️  Warning: Frontend index.html not found at:', frontendPath);
    console.warn('   Tried paths:');
    console.warn('     -', path1);
    console.warn('     -', path2);
    if (path3) console.warn('     -', path3);
    console.warn('   Set FRONTEND_DIST_PATH environment variable to specify custom path');
  }
  
  // Serve static assets (JS, CSS, images, etc.)
  try {
    app.use(express.static(frontendPath, {
      maxAge: '1y', // Cache static assets for 1 year
      etag: true,
    }));
  } catch (error) {
    console.error('Failed to setup static file serving:', error);
    logger.error('Failed to setup static file serving:', error);
  }

  // Serve index.html for all non-API routes (SPA fallback)
  // This must be after API routes and static files, but before error handlers
  app.get('*', (req, res, next) => {
    try {
      // Skip API routes
      if (req.path.startsWith('/api')) {
        return next();
      }
      // Skip socket.io
      if (req.path.startsWith('/socket.io')) {
        return next();
      }
      // Skip health check
      if (req.path === '/health') {
        return next();
      }
      const indexPath = path.join(frontendPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        next();
      }
    } catch (error) {
      console.error('Error serving index.html:', error);
      next(error);
    }
  });

  // ===== Error handling middleware (must be last) =====
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};