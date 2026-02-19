import { Router } from 'express';
import { BidController } from './controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission, requireRole } from '../../middlewares/rbac.middleware';
import { Permission, Role } from '../../config/rbac';
import { filterByCompany } from '../../middlewares/ownership.middleware';
import { z } from 'zod';

const router = Router();
const controller = new BidController();

// Validation schemas
const createBidSchema = z.object({
  body: z.object({
    rfqId: z.string({
      required_error: 'rfqId is required',
      invalid_type_error: 'rfqId must be a string',
    }).min(1, 'rfqId cannot be empty'),
    price: z.number({
      required_error: 'price is required',
      invalid_type_error: 'price must be a number',
    }).min(0, 'price must be greater than or equal to 0'),
    currency: z.string().optional(),
    paymentTerms: z.string({
      required_error: 'paymentTerms is required',
      invalid_type_error: 'paymentTerms must be a string',
    }).min(1, 'paymentTerms cannot be empty'),
    deliveryTime: z.number({
      required_error: 'deliveryTime is required',
      invalid_type_error: 'deliveryTime must be a number',
    }).min(1, 'deliveryTime must be at least 1 day'),
    deliveryDate: z.string({
      required_error: 'deliveryDate is required',
      invalid_type_error: 'deliveryDate must be a string (ISO date format)',
    }).refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, {
      message: 'deliveryDate must be a valid ISO date string (e.g., 2024-12-31T00:00:00.000Z)',
    }),
    validity: z.string({
      required_error: 'validity is required',
      invalid_type_error: 'validity must be a string (ISO date format)',
    }).refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, {
      message: 'validity must be a valid ISO date string (e.g., 2025-01-31T00:00:00.000Z)',
    }),
    items: z.array(
      z.object({
        name: z.string().min(1, 'Item name is required'),
        quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
        unit: z.string().min(1, 'Unit is required'),
        price: z.coerce.number().min(0, 'Price must be greater than or equal to 0'),
      })
    ).optional(),
    anonymousBidder: z.boolean().optional(),
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
    paymentTerms: z.string().optional(),
    deliveryTime: z.number().min(1).optional(),
    deliveryDate: z.string().optional(),
    validity: z.string().optional(),
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
        // Format errors to be more user-friendly
        const formattedErrors = error.errors.map((err) => {
          // Remove 'body.' prefix from field names for cleaner error messages
          const field = err.path.join('.').replace(/^body\./, '');
          
          return {
            field,
            message: err.message,
            code: err.code,
          };
        });

        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Please check the following fields and try again',
          errors: formattedErrors,
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
  '/:id/withdraw',
  authenticate,
  requirePermission(Permission.UPDATE_BID),
  controller.withdrawBid
);

router.post(
  '/:id/evaluate',
  authenticate,
  requireRole(Role.BUYER), // Only Buyer can evaluate bids
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

router.post(
  '/:id/enable-anonymity',
  authenticate,
  requirePermission(Permission.UPDATE_BID),
  controller.enableAnonymity
);

router.post(
  '/:id/reveal-identity',
  authenticate,
  requirePermission(Permission.UPDATE_BID),
  controller.revealIdentity
);

export default router;
