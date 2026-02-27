import { Request, Response, NextFunction } from 'express';
import { Role } from '../config/rbac';
import { logger } from '../utils/logger';
import { getRequestId } from '../utils/requestId';

/**
 * Ownership Middleware Factory
 * Ensures user can only access resources belonging to their company
 * Admin and Government roles bypass company isolation
 * 
 * Rules:
 * - Users belong to exactly one company
 * - Company isolation is enforced for all non-admin/government users
 * - Admin can access all companies
 */
export const requireOwnership = (companyIdField: string = 'companyId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'يجب تسجيل الدخول للوصول إلى هذا المورد.',
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
      
      // Ensure user has a companyId (users must belong to exactly one company)
      if (!userCompanyId) {
        logger.warn(
          `User ${req.user.userId} has no companyId - company isolation violation`
        );
        res.status(403).json({
          success: false,
          error: 'User must belong to a company',
          message: 'يجب أن تكون عضوًا في شركة للوصول إلى هذا المورد.',
          requestId: getRequestId(req),
        });
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
          message: 'غير مسموح لك بالوصول إلى هذا المورد. المورد ينتمي إلى شركة أخرى.',
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
            message: 'غير مسموح لك بإنشاء مورد لشركة أخرى.',
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
        message: 'حدث خطأ أثناء التحقق من الملكية. يرجى المحاولة مرة أخرى.',
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
        message: 'يجب تسجيل الدخول للوصول إلى هذا المورد.',
        requestId: getRequestId(req),
      });
      return;
    }
    
    const userRole = req.user.role as Role;
    const userCompanyId = req.user.companyId;
    
    // Admin and Government can see all companies
    // Company Manager should only see their company's data
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

/**
 * Middleware factory to check resource ownership by fetching the resource
 * Takes a function that fetches the resource by ID and returns it with a companyId field
 * 
 * @param fetchResource - Function that takes an ID and returns a resource with companyId
 * @param idParam - Name of the parameter containing the resource ID (default: 'id')
 * @param companyIdField - Name of the field containing companyId in the resource (default: 'companyId')
 */
export const requireResourceOwnership = <T extends { [key: string]: any }>(
  fetchResource: (id: string) => Promise<T | null>,
  idParam: string = 'id',
  companyIdField: string = 'companyId'
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'يجب تسجيل الدخول للوصول إلى هذا المورد.',
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
      
      // Ensure user has a companyId
      if (!userCompanyId) {
        logger.warn(
          `User ${req.user.userId} has no companyId - company isolation violation`
        );
        res.status(403).json({
          success: false,
          error: 'User must belong to a company',
          message: 'يجب أن تكون عضوًا في شركة للوصول إلى هذا المورد.',
          requestId: getRequestId(req),
        });
        return;
      }
      
      // Get resource ID from params
      const resourceId = req.params[idParam];
      if (!resourceId || resourceId === 'undefined' || resourceId === 'null') {
        res.status(400).json({
          success: false,
          error: 'Resource ID is required',
          requestId: getRequestId(req),
        });
        return;
      }
      
      // Validate that resourceId is a valid ObjectId format (24 hex characters)
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(resourceId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid resource ID format',
          requestId: getRequestId(req),
        });
        return;
      }
      
      // Fetch the resource
      const resource = await fetchResource(resourceId);
      if (!resource) {
        res.status(404).json({
          success: false,
          error: 'Resource not found',
          requestId: getRequestId(req),
        });
        return;
      }
      
      // Check ownership
      const resourceCompanyId = (resource as any)[companyIdField];
      if (!resourceCompanyId) {
        logger.warn(
          `Resource ${resourceId} has no ${companyIdField} field`
        );
        res.status(500).json({
          success: false,
          error: 'Resource ownership cannot be determined',
          requestId: getRequestId(req),
        });
        return;
      }
      
      // Handle both string and ObjectId comparisons
      const resourceCompanyIdStr = resourceCompanyId.toString();
      const userCompanyIdStr = userCompanyId.toString();
      
      if (resourceCompanyIdStr !== userCompanyIdStr) {
        logger.warn(
          `Ownership violation: User ${req.user.userId} (Company: ${userCompanyIdStr}) attempted to access Resource ${resourceId} (Company: ${resourceCompanyIdStr})`
        );
        res.status(403).json({
          success: false,
          error: 'Access denied: Resource belongs to different company',
          message: 'غير مسموح لك بالوصول إلى هذا المورد. المورد ينتمي إلى شركة أخرى.',
          requestId: getRequestId(req),
        });
        return;
      }
      
      // Store resource in request for use in controller
      (req as any).resource = resource;
      
      next();
    } catch (error) {
      logger.error('Resource ownership middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization error',
        message: 'حدث خطأ أثناء التحقق من الملكية. يرجى المحاولة مرة أخرى.',
        requestId: getRequestId(req),
      });
    }
  };
};
