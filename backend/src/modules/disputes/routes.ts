import { Router } from 'express';
import { DisputeController } from './controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission, requireRole } from '../../middlewares/rbac.middleware';
import { Permission, Role } from '../../config/rbac';
import { filterByCompany, requireResourceOwnership } from '../../middlewares/ownership.middleware';
import { DisputeRepository } from './repository';
import { z } from 'zod';

const router = Router();
const controller = new DisputeController();
const disputeRepository = new DisputeRepository();

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
    assignedToUserId: z.string().min(1, 'Assignment is required when escalating'),
    dueDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  }),
});

const assignDisputeSchema = z.object({
  body: z.object({
    assignedToUserId: z.string().min(1, 'Assigned user ID is required'),
    dueDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  }),
});

const resolveDisputeSchema = z.object({
  body: z.object({
    resolution: z.string().min(1, 'Resolution is required'),
  }),
});

const addAttachmentSchema = z.object({
  body: z.object({
    attachments: z.array(
      z.object({
        type: z.string(),
        url: z.string(),
      })
    ).min(1, 'At least one attachment is required'),
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
  // Note: filterByCompany is not applied here because Government needs to see all disputes
  // The controller handles filtering based on role
  controller.getDisputes
);

router.get(
  '/escalated',
  authenticate,
  requirePermission(Permission.ESCALATE_DISPUTE),
  controller.getEscalatedDisputes
);

router.get(
  '/assigned-to-me',
  authenticate,
  requirePermission(Permission.VIEW_DISPUTE),
  controller.getDisputesAssignedToMe
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
  '/:id/assign',
  authenticate,
  requireRole(Role.GOVERNMENT), // Only Government can assign
  requirePermission(Permission.UPDATE_DISPUTE),
  validate(assignDisputeSchema),
  controller.assignDispute
);

router.post(
  '/:id/resolve',
  authenticate,
  requireRole(Role.GOVERNMENT), // Only Government can resolve
  requirePermission(Permission.RESOLVE_DISPUTE),
  validate(resolveDisputeSchema),
  controller.resolveDispute
);

router.post(
  '/:id/attachments',
  authenticate,
  requirePermission(Permission.CREATE_DISPUTE),
  validate(addAttachmentSchema),
  controller.addAttachments
);

router.patch(
  '/:id',
  authenticate,
  requirePermission(Permission.UPDATE_DISPUTE), // Fixed: was VIEW_DISPUTE, should be UPDATE_DISPUTE
  requireResourceOwnership(
    (id) => disputeRepository.findById(id),
    'id',
    'companyId'
  ),
  validate(updateDisputeSchema),
  controller.updateDispute
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(Permission.UPDATE_DISPUTE), // Fixed: was VIEW_DISPUTE, should be UPDATE_DISPUTE
  requireResourceOwnership(
    (id) => disputeRepository.findById(id),
    'id',
    'companyId'
  ),
  controller.deleteDispute
);

export default router;
