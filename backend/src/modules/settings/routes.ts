import { Router } from 'express';
import { SettingsController } from './controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { Role } from '../../config/rbac';
import { logger } from '../../utils/logger';

const router = Router();
const controller = new SettingsController();

// Public route - get public settings (no auth required)
// Must be before other routes to avoid matching issues
router.get('/public', controller.getPublicSettings);

// Admin routes - require authentication and admin role
router.get('/', authenticate, requireRole(Role.ADMIN), controller.getSettings);
router.put('/', authenticate, requireRole(Role.ADMIN), controller.updateSettings);

// Log routes for debugging
logger.info('Settings routes registered: GET /api/settings, GET /api/settings/public, PUT /api/settings');

export default router;
