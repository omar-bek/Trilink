import { Request, Response, NextFunction } from 'express';
import { Permission, Role, hasPermission } from '../config/rbac';
import { logger } from '../utils/logger';
import { getRequestId } from '../utils/requestId';

/**
 * RBAC Middleware Factory
 * Creates middleware that checks if user has required permission
 */
export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          requestId: getRequestId(req),
        });
        return;
      }
      
      const userRole = req.user.role as Role;
      
      if (!hasPermission(userRole, permission)) {
        logger.warn(
          `Permission denied: User ${req.user.userId} (${userRole}) attempted ${permission}`
        );
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          requestId: getRequestId(req),
        });
        return;
      }
      
      next();
    } catch (error) {
      logger.error('RBAC middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization error',
        requestId: getRequestId(req),
      });
    }
  };
};

/**
 * Require specific role(s)
 */
export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          requestId: getRequestId(req),
        });
        return;
      }
      
      const userRole = req.user.role as Role;
      
      if (!roles.includes(userRole)) {
        logger.warn(
          `Role denied: User ${req.user.userId} (${userRole}) not in [${roles.join(', ')}]`
        );
        res.status(403).json({
          success: false,
          error: 'Insufficient role privileges',
          requestId: getRequestId(req),
        });
        return;
      }
      
      next();
    } catch (error) {
      logger.error('Role middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization error',
        requestId: getRequestId(req),
      });
    }
  };
};
