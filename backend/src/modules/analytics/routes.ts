import { Router } from 'express';
import { AnalyticsController } from './controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission, requireRole } from '../../middlewares/rbac.middleware';
import { Permission, Role } from '../../config/rbac';

const router = Router();
const controller = new AnalyticsController();

// Routes
// Government (read-only) and Admin (full) access
router.get(
  '/government',
  authenticate,
  requireRole(Role.GOVERNMENT, Role.ADMIN),
  requirePermission(Permission.VIEW_GOVERNMENT_ANALYTICS),
  controller.getGovernmentAnalytics
);

router.get(
  '/company',
  authenticate,
  requirePermission(Permission.VIEW_ANALYTICS),
  controller.getCompanyAnalytics
);

router.get(
  '/stream/purchase-requests',
  authenticate,
  requirePermission(Permission.VIEW_ANALYTICS),
  controller.streamPurchaseRequests
);

export default router;
