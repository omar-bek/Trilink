import rateLimit from 'express-rate-limit';
import { config } from '../config/env';
import { Request, Response } from 'express';
import { getRequestId } from '../utils/requestId';

/**
 * General Rate Limiter
 * Applies to all routes
 */
export const generalRateLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs, // 15 minutes
  max: config.security.rateLimitMaxRequests, // 100 requests per window
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
      requestId: getRequestId(req),
    });
  },
});

/**
 * Strict Rate Limiter for Authentication Routes
 * Prevents brute-force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again later',
      requestId: getRequestId(req),
    });
  },
});
