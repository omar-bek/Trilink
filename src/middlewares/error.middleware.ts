import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { getRequestId } from '../utils/requestId';

/**
 * Custom Application Error
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global Error Handler Middleware
 * Handles all errors and returns consistent error responses
 */
export const errorHandler = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = getRequestId(req);

  // Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    logger.warn(`Validation error: ${requestId}`, { errors });

    res.status(400).json({
      success: false,
      error: 'Validation error',
      errors,
      requestId,
    });
    return;
  }

  // Application errors
  if (err instanceof AppError) {
    logger.error(`Application error: ${requestId}`, {
      message: err.message,
      statusCode: err.statusCode,
      stack: err.stack,
    });

    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      requestId,
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    logger.warn(`JWT error: ${requestId}`, { error: err.message });

    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      requestId,
    });
    return;
  }

  // MongoDB errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    logger.error(`MongoDB error: ${requestId}`, { error: err.message });

    res.status(500).json({
      success: false,
      error: 'Database error',
      requestId,
    });
    return;
  }

  // Unknown errors
  logger.error(`Unknown error: ${requestId}`, {
    error: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    requestId,
  });
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    requestId: getRequestId(req),
  });
};
