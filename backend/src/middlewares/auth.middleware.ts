import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../utils/jwt';
import { logger } from '../utils/logger';
import { getRequestId } from '../utils/requestId';
import { getTokenBlacklistService } from '../utils/token-blacklist.service';

/**
 * Extend Express Request to include user information
 */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Authentication Middleware
 * Verifies JWT access token, checks blacklist, and attaches user info to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const requestId = getRequestId(req);
  
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        requestId,
      });
      return;
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      // Check blacklist BEFORE verification
      // If Redis is unavailable, blacklist check will fail open (allow token)
      const blacklistService = getTokenBlacklistService();
      let isBlacklisted = false;
      try {
        isBlacklisted = await blacklistService.isTokenBlacklisted(token);
      } catch (blacklistError) {
        // If blacklist check fails (e.g., Redis unavailable), log but continue
        // Fail open for availability - allow request to proceed
        logger.warn('Token blacklist check failed, allowing request:', blacklistError);
      }
      
      if (isBlacklisted) {
        logger.warn(`Blacklisted token attempt: ${requestId}`);
        res.status(401).json({
          success: false,
          error: 'Token has been revoked',
          requestId,
        });
        return;
      }

      // Verify token signature and expiry
      const payload = verifyAccessToken(token);
      
      // Check if user is globally blacklisted (password change, account lock, etc.)
      let isUserBlacklisted = false;
      try {
        isUserBlacklisted = await blacklistService.isUserBlacklisted(payload.userId);
      } catch (blacklistError) {
        // If blacklist check fails, log but continue (fail open)
        logger.warn('User blacklist check failed, allowing request:', blacklistError);
      }
      
      if (isUserBlacklisted) {
        logger.warn(`Blacklisted user token attempt: ${payload.userId}`);
        res.status(401).json({
          success: false,
          error: 'Token has been revoked',
          requestId,
        });
        return;
      }

      req.user = payload;
      next();
    } catch (error) {
      // Token verification failed (invalid or expired)
      logger.warn(`Invalid token attempt: ${requestId}`, error);
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        requestId,
      });
    }
  } catch (error) {
    // Unexpected error in authentication middleware
    logger.error('Authentication middleware error:', {
      error,
      requestId,
      url: req.url,
      method: req.method,
    });
    res.status(500).json({
      success: false,
      error: 'Authentication error',
      requestId,
    });
  }
};

/**
 * Optional Authentication Middleware
 * Attaches user info if token is present, but doesn't fail if missing
 */
export const optionalAuthenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = verifyAccessToken(token);
        req.user = payload;
      } catch (error) {
        // Silently fail for optional auth
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
