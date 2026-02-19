import { Router } from 'express';
import { PurchaseRequestController } from './controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { Permission } from '../../config/rbac';
import { requireOwnership } from '../../middlewares/ownership.middleware';
import { filterByCompany } from '../../middlewares/ownership.middleware';
import { z } from 'zod';

const router = Router();
const controller = new PurchaseRequestController();

// Validation schemas
const createPurchaseRequestSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    items: z.array(
      z.object({
        name: z.string(),
        quantity: z.number().min(1),
        unit: z.string(),
        specifications: z.string(),
        estimatedPrice: z.number().optional(),
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
      coordinates: z.object({
        lat: z.number(),
        lng: z.number(),
      }).optional(),
    }),
    requiredDeliveryDate: z.string(),
  }),
});

const updatePurchaseRequestSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    items: z.array(
      z.object({
        name: z.string(),
        quantity: z.number().min(1),
        unit: z.string(),
        specifications: z.string(),
        estimatedPrice: z.number().optional(),
      })
    ).optional(),
    budget: z.number().min(0).optional(),
    currency: z.string().optional(),
    deliveryLocation: z.object({
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      zipCode: z.string().optional(),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number(),
      }).optional(),
    }).optional(),
    requiredDeliveryDate: z.string().optional(),
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
  requirePermission(Permission.CREATE_PURCHASE_REQUEST),
  requireOwnership('companyId'),
  validate(createPurchaseRequestSchema),
  controller.createPurchaseRequest
);

router.get(
  '/',
  authenticate,
  requirePermission(Permission.VIEW_PURCHASE_REQUEST),
  filterByCompany,
  controller.getPurchaseRequests
);

router.get(
  '/:id',
  authenticate,
  requirePermission(Permission.VIEW_PURCHASE_REQUEST),
  controller.getPurchaseRequestById
);

router.patch(
  '/:id',
  authenticate,
  requirePermission(Permission.UPDATE_PURCHASE_REQUEST),
  validate(updatePurchaseRequestSchema),
  controller.updatePurchaseRequest
);

router.post(
  '/:id/approve',
  authenticate,
  requirePermission(Permission.UPDATE_PURCHASE_REQUEST),
  controller.approvePurchaseRequest
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(Permission.DELETE_PURCHASE_REQUEST),
  controller.deletePurchaseRequest
);

export default router;
