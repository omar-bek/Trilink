import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to generate and attach a unique request ID to each request
 * Useful for tracing requests through logs and debugging
 */
export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = uuidv4();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

/**
 * Get request ID from request object
 */
export const getRequestId = (req: Request): string => {
  return (req.headers['x-request-id'] as string) || 'unknown';
};
