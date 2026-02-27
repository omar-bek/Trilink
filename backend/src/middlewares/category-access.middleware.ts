import { Request, Response, NextFunction } from 'express';
import { CategoryRoutingService } from '../modules/category-routing/service';
import { AppError } from './error.middleware';
import { Role } from '../config/rbac';
import { PurchaseRequestRepository } from '../modules/purchase-requests/repository';

/**
 * Middleware to enforce category-based access control for purchase requests
 * Companies can only view PRs that match their specializations
 */
export const enforceCategoryAccess = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip for admins
    if (req.user?.role === Role.ADMIN) {
      return next();
    }

    // Skip if user doesn't have companyId (shouldn't happen, but safety check)
    if (!req.user?.companyId) {
      return next();
    }

    // Only apply to purchase request routes
    const purchaseRequestId = req.params.id;
    if (!purchaseRequestId) {
      return next();
    }

    // Get the purchase request
    const purchaseRequestRepository = new PurchaseRequestRepository();
    const purchaseRequest = await purchaseRequestRepository.findById(purchaseRequestId);

    if (!purchaseRequest) {
      return next(); // Let the service handle "not found" error
    }

    // If the PR belongs to the user's company, allow access
    if (purchaseRequest.companyId.toString() === req.user.companyId) {
      return next();
    }

    // For other companies, check category specialization
    const categoryRoutingService = new CategoryRoutingService();
    const canView = await categoryRoutingService.canCompanyViewPurchaseRequest(
      req.user.companyId,
      purchaseRequest.categoryId.toString(),
      purchaseRequest.subCategoryId?.toString()
    );

    if (!canView) {
      throw new AppError(
        'Access denied: Your company does not specialize in this category',
        403
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
