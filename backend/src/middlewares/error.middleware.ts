import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { getRequestId } from '../utils/requestId';
import { logger } from '../utils/logger';

/**
 * Custom application error class
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
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = getRequestId(req);

  // Zod validation errors
  if (err instanceof ZodError) {
    const errorMessages = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(400).json({
      success: false,
      error: 'Validation error',
      message: `Validation failed: ${errorMessages.map(e => e.message).join(', ')}`,
      errors: errorMessages,
      requestId,
    });
    return;
  }

  // Application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      message: err.message,
      requestId,
    });
    return;
  }

  // Unknown errors - log for debugging
  logger.error('Unexpected error:', {
    error: err.message,
    stack: err.stack,
    requestId,
    url: req.url,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    requestId,
    ...(process.env.NODE_ENV === 'development' && {
      message: err.message,
      stack: err.stack,
    }),
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
};
