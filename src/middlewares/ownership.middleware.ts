import { Request, Response, NextFunction } from 'express';
import { Role } from '../config/rbac';
import { logger } from '../utils/logger';
import { getRequestId } from '../utils/requestId';

/**
 * Ownership Middleware Factory
 * Ensures user can only access resources belonging to their company
 * Admin and Government roles bypass company isolation
 */
export const requireOwnership = (companyIdField: string = 'companyId') => {
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
      const userCompanyId = req.user.companyId;
      
      // Admin and Government bypass company isolation
      if (userRole === Role.ADMIN || userRole === Role.GOVERNMENT) {
        next();
        return;
      }
      
      // Extract companyId from request (body, params, or query)
      const resourceCompanyId =
        req.body[companyIdField] ||
        req.params[companyIdField] ||
        req.query[companyIdField];
      
      // If accessing existing resource, check ownership
      if (resourceCompanyId && resourceCompanyId !== userCompanyId) {
        logger.warn(
          `Ownership violation: User ${req.user.userId} (Company: ${userCompanyId}) attempted to access Company: ${resourceCompanyId}`
        );
        res.status(403).json({
          success: false,
          error: 'Access denied: Resource belongs to different company',
          requestId: getRequestId(req),
        });
        return;
      }
      
      // For creation, ensure companyId matches user's company
      if (req.method === 'POST' && req.body[companyIdField]) {
        if (req.body[companyIdField] !== userCompanyId) {
          res.status(403).json({
            success: false,
            error: 'Cannot create resource for different company',
            requestId: getRequestId(req),
          });
          return;
        }
      }
      
      // Auto-set companyId for creation if not provided
      if (req.method === 'POST' && !req.body[companyIdField]) {
        req.body[companyIdField] = userCompanyId;
      }
      
      next();
    } catch (error) {
      logger.error('Ownership middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization error',
        requestId: getRequestId(req),
      });
    }
  };
};

/**
 * Middleware to filter query results by companyId
 * Attaches company filter to request for repository layer
 */
export const filterByCompany = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
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
    const userCompanyId = req.user.companyId;
    
    // Admin and Government can see all companies
    if (userRole !== Role.ADMIN && userRole !== Role.GOVERNMENT) {
      // Attach company filter to request
      req.query.companyId = userCompanyId;
    }
    
    next();
  } catch (error) {
    logger.error('Company filter middleware error:', error);
    next();
  }
};
