import { Router } from 'express';
import { CategoryRoutingController } from './controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new CategoryRoutingController();

// All routes require authentication
router.use(authenticate);

router.get('/match', controller.findMatchingCompanies);
router.get('/can-view', controller.canCompanyViewPurchaseRequest);

export default router;
