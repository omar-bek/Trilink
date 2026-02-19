import { Router } from 'express';
import { CompanyCategoryController } from './controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { Role } from '../../config/rbac';

const router = Router();
const controller = new CompanyCategoryController();

// All routes require authentication
router.use(authenticate);

// Get company categories (company users and admins)
router.get('/:companyId/categories', controller.getCompanyCategories);

// Add/remove categories (admin only, or company owner)
router.post(
  '/:companyId/categories',
  requireRole([Role.ADMIN, Role.COMPANY_MANAGER]),
  controller.addCategoriesToCompany
);
router.delete(
  '/:companyId/categories/:categoryId',
  requireRole([Role.ADMIN, Role.COMPANY_MANAGER]),
  controller.removeCategoryFromCompany
);

export default router;
