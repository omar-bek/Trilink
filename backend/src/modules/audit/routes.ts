import { Router } from 'express';
import { AuditLogController } from './controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { Permission } from '../../config/rbac';

const router = Router();
const controller = new AuditLogController();

// Routes - All authenticated users can view their company's audit logs
// Admin and Government can view all audit logs
router.get(
  '/',
  authenticate,
  requirePermission(Permission.VIEW_ANALYTICS), // Using VIEW_ANALYTICS as audit is part of analytics
  controller.getAuditLogs
);

router.get(
  '/resource/:resource/:resourceId',
  authenticate,
  requirePermission(Permission.VIEW_ANALYTICS),
  controller.getAuditLogsByResource
);

router.get(
  '/user/:userId',
  authenticate,
  requirePermission(Permission.VIEW_ANALYTICS),
  controller.getAuditLogsByUser
);

router.get(
  '/company/:companyId',
  authenticate,
  requirePermission(Permission.VIEW_ANALYTICS),
  controller.getAuditLogsByCompany
);

// Export endpoint for PDF/Excel reports
router.get(
  '/export',
  authenticate,
  requirePermission(Permission.VIEW_ANALYTICS),
  controller.exportAuditLogs
);

export default router;
