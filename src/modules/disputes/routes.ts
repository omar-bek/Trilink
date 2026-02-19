import { Router } from 'express';
import { DisputeController } from './controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { Permission } from '../../config/rbac';
import { filterByCompany } from '../../middlewares/ownership.middleware';
import { z } from 'zod';

const router = Router();
const controller = new DisputeController();

// Validation schemas
const createDisputeSchema = z.object({
  body: z.object({
    contractId: z.string(),
    againstCompanyId: z.string(),
    type: z.string(),
    description: z.string().min(1),
    attachments: z.array(
      z.object({
        type: z.string(),
        url: z.string(),
      })
    ).optional(),
  }),
});

const escalateDisputeSchema = z.object({
  body: z.object({
    governmentNotes: z.string().optional(),
  }),
});

const updateDisputeSchema = z.object({
  body: z.object({
    status: z.string().optional(),
    resolution: z.string().optional(),
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
  requirePermission(Permission.CREATE_DISPUTE),
  validate(createDisputeSchema),
  controller.createDispute
);

router.get(
  '/',
  authenticate,
  requirePermission(Permission.VIEW_DISPUTE),
  filterByCompany,
  controller.getDisputes
);

router.get(
  '/escalated',
  authenticate,
  requirePermission(Permission.ESCALATE_DISPUTE),
  controller.getEscalatedDisputes
);

router.get(
  '/:id',
  authenticate,
  requirePermission(Permission.VIEW_DISPUTE),
  controller.getDisputeById
);

router.post(
  '/:id/escalate',
  authenticate,
  requirePermission(Permission.ESCALATE_DISPUTE),
  validate(escalateDisputeSchema),
  controller.escalateDispute
);

router.post(
  '/:id/resolve',
  authenticate,
  requirePermission(Permission.RESOLVE_DISPUTE),
  controller.resolveDispute
);

router.patch(
  '/:id',
  authenticate,
  requirePermission(Permission.VIEW_DISPUTE),
  validate(updateDisputeSchema),
  controller.updateDispute
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(Permission.VIEW_DISPUTE),
  controller.deleteDispute
);

export default router;
