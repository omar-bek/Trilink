import { Router } from 'express';
import { DashboardController } from './controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new DashboardController();

// Dashboard route - accessible to all authenticated users
router.get(
  '/',
  authenticate,
  controller.getDashboard
);

export default router;
