import { Router } from 'express';
import { PaymentController } from './controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { Permission } from '../../config/rbac';
import { filterByCompany } from '../../middlewares/ownership.middleware';
import { z } from 'zod';

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

const processPaymentSchema = z.object({
  body: z.object({
    paymentMethod: z.string(),
    transactionId: z.string(),
    notes: z.string().optional(),
  }),
});

const updatePaymentSchema = z.object({
  body: z.object({
    status: z.string().optional(),
    paidDate: z.string().optional(),
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
  controller.getPaymentById
);

router.post(
  '/:id/process',
  authenticate,
  requirePermission(Permission.PROCESS_PAYMENT),
  validate(processPaymentSchema),
  controller.processPayment
);

router.patch(
  '/:id',
  authenticate,
  requirePermission(Permission.VIEW_PAYMENT),
  validate(updatePaymentSchema),
  controller.updatePayment
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(Permission.VIEW_PAYMENT),
  controller.deletePayment
);

export default router;
