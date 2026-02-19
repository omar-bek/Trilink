import { Router } from 'express';
import { PaymentController } from './controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission, requireRole } from '../../middlewares/rbac.middleware';
import { Permission, Role } from '../../config/rbac';
import { filterByCompany } from '../../middlewares/ownership.middleware';
import { requirePaymentOwnership } from './middlewares/payment-ownership.middleware';
import { z } from 'zod';
import { rawBodyMiddleware, extractWebhookSignature } from './middlewares/webhook.middleware';

const router = Router();
const controller = new PaymentController();

// Validation schemas
const createPaymentSchema = z.object({
  body: z.object({
    contractId: z.string(),
    recipientCompanyId: z.string(),
    milestone: z.string(),
    amount: z.number().min(0),
    currency: z.string().optional(),
    dueDate: z.string(),
    notes: z.string().optional(),
  }),
});

const approvePaymentSchema = z.object({
  body: z.object({
    notes: z.string().optional(),
  }),
});

const rejectPaymentSchema = z.object({
  body: z.object({
    rejectionReason: z.string().min(1, 'Rejection reason is required'),
  }),
});

const processPaymentSchema = z.object({
  body: z.object({
    paymentMethod: z.string(),
    gateway: z.enum(['stripe', 'paypal']),
    notes: z.string().optional(),
  }),
});

const updatePaymentSchema = z.object({
  body: z.object({
    paidDate: z.string().optional(),
    notes: z.string().optional(),
  }),
});

const retryPaymentSchema = z.object({
  body: z.object({
    paymentMethod: z.string().optional(),
    gateway: z.enum(['stripe', 'paypal']).optional(),
    notes: z.string().optional(),
  }),
});

const updatePaymentMethodSchema = z.object({
  body: z.object({
    paymentMethod: z.string().min(1, 'Payment method is required'),
    gateway: z.enum(['stripe', 'paypal']),
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
  requirePermission(Permission.CREATE_PAYMENT),
  validate(createPaymentSchema),
  controller.createPayment
);

router.get(
  '/',
  authenticate,
  requirePermission(Permission.VIEW_PAYMENT),
  filterByCompany,
  controller.getPayments
);

router.get(
  '/:id',
  authenticate,
  requirePermission(Permission.VIEW_PAYMENT),
  requirePaymentOwnership(),
  controller.getPaymentById
);

router.post(
  '/:id/approve',
  authenticate,
  requireRole(Role.BUYER, Role.COMPANY_MANAGER), // Buyer and Company Manager can approve
  requirePermission(Permission.VIEW_PAYMENT),
  requirePaymentOwnership(),
  validate(approvePaymentSchema),
  controller.approvePayment
);

router.post(
  '/:id/reject',
  authenticate,
  requireRole(Role.BUYER, Role.COMPANY_MANAGER), // Buyer and Company Manager can reject
  requirePermission(Permission.VIEW_PAYMENT),
  requirePaymentOwnership(),
  validate(rejectPaymentSchema),
  controller.rejectPayment
);

router.post(
  '/:id/process',
  authenticate,
  requirePermission(Permission.PROCESS_PAYMENT),
  requirePaymentOwnership(),
  validate(processPaymentSchema),
  controller.processPayment
);

router.patch(
  '/:id',
  authenticate,
  requirePermission(Permission.UPDATE_PAYMENT),
  requirePaymentOwnership(),
  validate(updatePaymentSchema),
  controller.updatePayment
);

router.post(
  '/:id/retry',
  authenticate,
  requirePermission(Permission.PROCESS_PAYMENT),
  requirePaymentOwnership(),
  validate(retryPaymentSchema),
  controller.retryPayment
);

router.patch(
  '/:id/payment-method',
  authenticate,
  requirePermission(Permission.UPDATE_PAYMENT),
  requirePaymentOwnership(),
  validate(updatePaymentMethodSchema),
  controller.updatePaymentMethod
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(Permission.UPDATE_PAYMENT), // Fixed: was VIEW_PAYMENT, should be UPDATE_PAYMENT
  requirePaymentOwnership(),
  controller.deletePayment
);

// Webhook routes (no authentication required, verified by signature)
router.post(
  '/webhooks/stripe',
  rawBodyMiddleware,
  extractWebhookSignature,
  controller.handleStripeWebhook
);

router.post(
  '/webhooks/paypal',
  rawBodyMiddleware,
  extractWebhookSignature,
  controller.handlePayPalWebhook
);

export default router;
