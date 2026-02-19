import { Router } from 'express';
import { BidController } from './controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { Permission } from '../../config/rbac';
import { filterByCompany } from '../../middlewares/ownership.middleware';
import { z } from 'zod';

const router = Router();
const controller = new BidController();

// Validation schemas
const createBidSchema = z.object({
  body: z.object({
    rfqId: z.string(),
    price: z.number().min(0),
    currency: z.string().optional(),
    terms: z.string().min(1),
    deliveryTime: z.number().min(1),
    deliveryDate: z.string(),
    isAnonymous: z.boolean().optional(),
    attachments: z.array(
      z.object({
        type: z.string(),
        url: z.string(),
      })
    ).optional(),
  }),
});

const updateBidSchema = z.object({
  body: z.object({
    price: z.number().min(0).optional(),
    terms: z.string().optional(),
    deliveryTime: z.number().min(1).optional(),
    deliveryDate: z.string().optional(),
    status: z.string().optional(),
    attachments: z.array(
      z.object({
        type: z.string(),
        url: z.string(),
      })
    ).optional(),
  }),
});

const evaluateBidSchema = z.object({
  body: z.object({
    status: z.string(),
    notes: z.string().optional(),
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
  requirePermission(Permission.CREATE_BID),
  validate(createBidSchema),
  controller.createBid
);

router.get(
  '/',
  authenticate,
  requirePermission(Permission.VIEW_BID),
  filterByCompany,
  controller.getBids
);

router.get(
  '/rfq/:rfqId',
  authenticate,
  requirePermission(Permission.VIEW_BID),
  controller.getBidsByRFQ
);

router.get(
  '/:id',
  authenticate,
  requirePermission(Permission.VIEW_BID),
  controller.getBidById
);

router.patch(
  '/:id',
  authenticate,
  requirePermission(Permission.UPDATE_BID),
  validate(updateBidSchema),
  controller.updateBid
);

router.post(
  '/:id/evaluate',
  authenticate,
  requirePermission(Permission.EVALUATE_BID),
  validate(evaluateBidSchema),
  controller.evaluateBid
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(Permission.UPDATE_BID),
  controller.deleteBid
);

export default router;
