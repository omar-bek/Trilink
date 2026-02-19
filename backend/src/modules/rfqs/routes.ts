import { Router } from 'express';
import { RFQController } from './controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission, requireRole } from '../../middlewares/rbac.middleware';
import { Permission, Role } from '../../config/rbac';
import { filterByCompany } from '../../middlewares/ownership.middleware';
import { z } from 'zod';

const router = Router();
const controller = new RFQController();

// Validation schemas
const createRFQSchema = z.object({
  body: z.object({
    purchaseRequestId: z.string(),
    type: z.string(),
    targetRole: z.string(), // Target role (Supplier, Logistics, Clearance, Service Provider)
    targetCompanyType: z.string(),
    targetCompanyIds: z.array(z.string()).optional(), // Optional: specific company IDs that should receive this RFQ
    title: z.string().min(1),
    description: z.string().min(1),
    items: z.array(
      z.object({
        name: z.string(),
        quantity: z.number().min(1),
        unit: z.string(),
        specifications: z.string(),
      })
    ).min(1),
    budget: z.number().min(0),
    currency: z.string().optional(),
    deliveryLocation: z.object({
      address: z.string(),
      city: z.string(),
      state: z.string(),
      country: z.string(),
      zipCode: z.string(),
    }),
    requiredDeliveryDate: z.string(),
    deadline: z.string(),
    anonymousBuyer: z.boolean().optional(), // Flag to hide buyer identity
  }),
});

const updateRFQSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    items: z.array(
      z.object({
        name: z.string(),
        quantity: z.number().min(1),
        unit: z.string(),
        specifications: z.string(),
      })
    ).optional(),
    budget: z.number().min(0).optional(),
    deadline: z.string().optional(),
    status: z.string().optional(),
  }),
});

// Validation middleware
const validate = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse({ body: req.body, params: req.params, query: req.query });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          errors: error.errors,
        });
      } else {
        next(error);
      }
    }
  };
};

// Routes
router.post(
  '/',
  authenticate,
  requireRole(Role.BUYER, Role.COMPANY_MANAGER), // Buyer and Company Manager can create RFQs
  requirePermission(Permission.CREATE_RFQ),
  validate(createRFQSchema),
  controller.createRFQ
);

router.get(
  '/',
  authenticate,
  requirePermission(Permission.VIEW_RFQ),
  filterByCompany,
  controller.getRFQs
);

router.get(
  '/available',
  authenticate,
  requirePermission(Permission.VIEW_RFQ),
  controller.getAvailableRFQs
);

router.get(
  '/purchase-request/:purchaseRequestId',
  authenticate,
  requirePermission(Permission.VIEW_RFQ),
  controller.getRFQsByPurchaseRequest
);

router.get(
  '/:rfqId/bids/compare',
  authenticate,
  requirePermission(Permission.VIEW_RFQ),
  controller.compareBids
);

router.get(
  '/:id',
  authenticate,
  requirePermission(Permission.VIEW_RFQ),
  controller.getRFQById
);

router.patch(
  '/:id',
  authenticate,
  requirePermission(Permission.UPDATE_RFQ),
  validate(updateRFQSchema),
  controller.updateRFQ
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(Permission.UPDATE_RFQ),
  controller.deleteRFQ
);

router.post(
  '/:id/enable-anonymity',
  authenticate,
  requirePermission(Permission.UPDATE_RFQ),
  controller.enableAnonymity
);

router.post(
  '/:id/reveal-identity',
  authenticate,
  requirePermission(Permission.UPDATE_RFQ),
  controller.revealIdentity
);

export default router;
