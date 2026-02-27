import { Request, Response, NextFunction } from 'express';
import { Role } from '../config/rbac';
import { logger } from '../utils/logger';
import { getRequestId } from '../utils/requestId';

/**
 * Resource Ownership Middleware Factory
 * Checks if a resource (by ID) belongs to the user's company
 * Works by fetching the resource and checking its companyId field
 * Admin and Government roles bypass company isolation
 * 
 * @param resourceType - Type of resource (e.g., 'purchaseRequest', 'contract', 'shipment')
 * @param idParam - Name of the route parameter containing the resource ID (default: 'id')
 * @param companyIdField - Field name in the resource that contains companyId (default: 'companyId')
 * @param fetchResource - Function to fetch the resource by ID
 */
export const requireResourceOwnership = <T extends { companyId: string | { toString(): string } }>(
  resourceType: string,
  idParam: string = 'id',
  companyIdField: string = 'companyId',
  fetchResource: (id: string) => Promise<T | null>
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

      // Get resource ID from route params
      const resourceId = req.params[idParam];
      if (!resourceId) {
        res.status(400).json({
          success: false,
          error: `Resource ID (${idParam}) is required`,
          requestId: getRequestId(req),
        });
        return;
      }

      // Fetch the resource
      const resource = await fetchResource(resourceId);
      if (!resource) {
        res.status(404).json({
          success: false,
          error: `${resourceType} not found`,
          requestId: getRequestId(req),
        });
        return;
      }

      // Extract companyId from resource
      const resourceCompanyId = resource[companyIdField as keyof T];
      const resourceCompanyIdStr = typeof resourceCompanyId === 'string' 
        ? resourceCompanyId 
        : (resourceCompanyId && typeof resourceCompanyId === 'object' && 'toString' in resourceCompanyId)
          ? resourceCompanyId.toString()
          : String(resourceCompanyId);

      // Check ownership
      if (resourceCompanyIdStr !== userCompanyId) {
        logger.warn(
          `Ownership violation: User ${req.user.userId} (Company: ${userCompanyId}) attempted to access ${resourceType} ${resourceId} (Company: ${resourceCompanyIdStr})`
        );
        res.status(403).json({
          success: false,
          error: `Access denied: ${resourceType} belongs to different company`,
          message: `غير مسموح لك بالوصول إلى هذا ${resourceType}. المورد ينتمي إلى شركة أخرى.`,
          requestId: getRequestId(req),
        });
        return;
      }

      // Attach resource to request for use in controller
      (req as any).resource = resource;
      next();
    } catch (error) {
      logger.error(`Resource ownership middleware error (${resourceType}):`, error);
      res.status(500).json({
        success: false,
        error: 'Authorization error',
        message: 'حدث خطأ أثناء التحقق من الملكية. يرجى المحاولة مرة أخرى.',
        requestId: getRequestId(req),
      });
    }
  };
};
