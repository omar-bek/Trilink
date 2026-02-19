import { Router } from 'express';
import { AnalyticsController } from './controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { Permission } from '../../config/rbac';

const router = Router();
const controller = new AnalyticsController();

// Routes
router.get(
  '/government',
  authenticate,
  requirePermission(Permission.VIEW_GOVERNMENT_ANALYTICS),
  controller.getGovernmentAnalytics
);

router.get(
  '/company',
  authenticate,
  requirePermission(Permission.VIEW_ANALYTICS),
  controller.getCompanyAnalytics
);

export default router;
