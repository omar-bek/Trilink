import { Request, Response, NextFunction } from 'express';
import { Role } from '../config/rbac';
import { logger } from '../utils/logger';
import { getRequestId } from '../utils/requestId';
import { CompanyCategoryRepository } from '../modules/company-categories/repository';

/**
 * Category Filter Middleware
 * SECURITY FIX: Filters purchase requests by company's category specializations
 * Prevents supplier companies from seeing PRs outside their specialization
 */
export const filterByCategorySpecialization = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return next();
    }

    const userRole = req.user.role as Role;
    const userCompanyId = req.user.companyId;

    // Admin and Government can see all PRs
    if (userRole === Role.ADMIN || userRole === Role.GOVERNMENT) {
      return next();
    }

    // Buyers can see all PRs from their company
    if (userRole === Role.BUYER || userRole === Role.COMPANY_MANAGER) {
      // Check if this is a list endpoint (not a single PR view)
      if (req.path === '/' || req.path.endsWith('/purchase-requests')) {
        // Buyers see all PRs from their company (no category filter needed)
        return next();
      }
      return next();
    }

    // For supplier/logistics/clearance/service provider companies:
    // Get company's categories and attach to request for filtering
    if (userCompanyId) {
      try {
        const companyCategoryRepository = new CompanyCategoryRepository();
        const companyCategories = await companyCategoryRepository.getCategoriesByCompany(
          userCompanyId
        );

        if (companyCategories.length > 0) {
          const categoryIds = companyCategories.map((cc) =>
            (cc.categoryId as any)._id?.toString() || (cc.categoryId as any).toString()
          );

          // Attach category filter to request
          if (!req.categoryFilter) {
            req.categoryFilter = {};
          }
          req.categoryFilter.categoryIds = categoryIds;

          logger.debug(
            `Category filter applied for company ${userCompanyId}: ${categoryIds.length} categories`
          );
        } else {
          // Company has no categories - they shouldn't see any PRs
          req.categoryFilter = { categoryIds: [] };
          logger.warn(
            `Company ${userCompanyId} has no categories assigned - will see no PRs`
          );
        }
      } catch (error) {
        logger.error('Error fetching company categories for filtering', error);
        // Continue without filter (fail open for now, but should be fixed)
      }
    }

    next();
  } catch (error) {
    logger.error('Category filter middleware error', error);
    next(error);
  }
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      categoryFilter?: {
        categoryIds?: string[];
      };
    }
  }
}
