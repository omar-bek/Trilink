import { Router } from 'express';
import { CategoryController } from './controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { Role } from '../../config/rbac';

const router = Router();
const controller = new CategoryController();

// Public routes (for category selection in forms)
router.get('/', controller.getRootCategories);
router.get('/tree', controller.getCategoryTree);
router.get('/all', controller.getAllCategories); // Public: Get all active categories
router.get('/stats', controller.getCategoryStats); // Public: Get category statistics for debugging
router.get('/:id', controller.getCategoryById);
router.get('/:id/children', controller.getCategoryChildren);

// Admin-only routes
router.post(
  '/',
  authenticate,
  requireRole([Role.ADMIN]),
  controller.createCategory
);
router.put(
  '/:id',
  authenticate,
  requireRole([Role.ADMIN]),
  controller.updateCategory
);
router.delete(
  '/:id',
  authenticate,
  requireRole([Role.ADMIN]),
  controller.deleteCategory
);
router.get(
  '/admin/all',
  authenticate,
  requireRole([Role.ADMIN]),
  controller.getAllCategoriesAdmin
);

export default router;
