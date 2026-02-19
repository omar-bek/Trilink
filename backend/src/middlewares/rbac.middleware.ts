import { Request, Response, NextFunction } from 'express';
import { Permission, Role, hasPermission, hasUserPermission } from '../config/rbac';
import { logger } from '../utils/logger';
import { getRequestId } from '../utils/requestId';
import { UserRepository } from '../modules/users/repository';

/**
 * RBAC Middleware Factory
 * Creates middleware that checks if user has required permission
 * Supports custom permissions in addition to role-based permissions
 */
export const requirePermission = (permission: Permission) => {
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

      // Load user's custom permissions from database
      let customPermissions: Permission[] | undefined;
      try {
        const userRepository = new UserRepository();
        const user = await userRepository.findById(req.user.userId);
        if (user && user.customPermissions) {
          customPermissions = user.customPermissions as Permission[];
        }
      } catch (error) {
        logger.warn('Failed to load custom permissions, using role permissions only:', error);
      }

      if (!hasUserPermission(userRole, permission, customPermissions)) {
        logger.warn(
          `Permission denied: User ${req.user.userId} (${userRole}) attempted ${permission}`
        );
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          message: 'غير مسموح لك بالوصول إلى هذا المورد. يرجى الاتصال بالمسؤول إذا كنت تعتقد أن هذا خطأ.',
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
        message: 'حدث خطأ أثناء التحقق من الصلاحيات. يرجى المحاولة مرة أخرى.',
        requestId: getRequestId(req),
      });
    }
  };
};

/**
 * Require permission OR allow access to own company
 * Used for company endpoints where users should be able to view their own company
 * even without the VIEW_COMPANIES permission
 */
export const requirePermissionOrOwnCompany = (permission: Permission) => {
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

      // Check if user has the required permission
      if (hasPermission(userRole, permission)) {
        next();
        return;
      }

      // If no permission, check if user is accessing their own company
      const companyId = req.params.id;

      // Normalize both IDs to strings for comparison
      const normalizedCompanyId = companyId ? String(companyId).trim() : null;
      const normalizedUserCompanyId = userCompanyId ? String(userCompanyId).trim() : null;

      if (normalizedCompanyId && normalizedUserCompanyId && normalizedCompanyId === normalizedUserCompanyId) {
        // User is viewing their own company, allow access
        logger.info(
          `Own company access granted: User ${req.user.userId} (${userRole}) accessing own company ${normalizedCompanyId}`
        );
        next();
        return;
      }

      // No permission and not own company
      logger.warn(
        `Permission denied: User ${req.user.userId} (${userRole}, companyId: ${normalizedUserCompanyId || 'none'}) attempted ${permission} for company ${normalizedCompanyId || 'none'}`
      );
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'غير مسموح لك بالوصول إلى هذا المورد. يرجى الاتصال بالمسؤول إذا كنت تعتقد أن هذا خطأ.',
        requestId: getRequestId(req),
      });
    } catch (error) {
      logger.error('RBAC middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization error',
        message: 'حدث خطأ أثناء التحقق من الصلاحيات. يرجى المحاولة مرة أخرى.',
        requestId: getRequestId(req),
      });
    }
  };
};

/**
 * Require specific role(s)
 * Admin role bypasses all role restrictions
 */
export const requireRole = (...roles: Role[]) => {
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

      // Admin bypasses all role restrictions
      if (userRole === Role.ADMIN || userRole === 'Admin') {
        next();
        return;
      }

      // Check if user role is in allowed roles (normalize string comparison)
      const normalizedUserRole = userRole.toString();
      const roleMatches = roles.some(role => role.toString() === normalizedUserRole);

      if (!roleMatches) {
        logger.warn(
          `Role denied: User ${req.user.userId} (${userRole}) not in [${roles.join(', ')}]`
        );
        res.status(403).json({
          success: false,
          error: 'Insufficient role privileges',
          message: `غير مسموح لك بهذا الإجراء. يتطلب هذا الإجراء أحد الأدوار التالية: ${roles.join(', ')}. يرجى الاتصال بالمسؤول إذا كنت تعتقد أن هذا خطأ.`,
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
        message: 'حدث خطأ أثناء التحقق من الصلاحيات. يرجى المحاولة مرة أخرى.',
        requestId: getRequestId(req),
      });
    }
  };
};
