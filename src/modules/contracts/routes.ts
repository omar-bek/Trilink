import { Router } from 'express';
import { ContractController } from './controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { Permission } from '../../config/rbac';
import { filterByCompany } from '../../middlewares/ownership.middleware';
import { z } from 'zod';

const router = Router();
const controller = new ContractController();

// Validation schemas
const createContractSchema = z.object({
  body: z.object({
    purchaseRequestId: z.string(),
    parties: z.array(
      z.object({
        companyId: z.string(),
        userId: z.string(),
        role: z.string(),
        bidId: z.string().optional(),
      })
    ).min(1),
    amounts: z.object({
      total: z.number().min(0),
      currency: z.string().optional(),
      breakdown: z.array(
        z.object({
          partyId: z.string(),
          amount: z.number().min(0),
          description: z.string(),
        })
      ),
    }),
    paymentSchedule: z.array(
      z.object({
        milestone: z.string(),
        amount: z.number().min(0),
        dueDate: z.string(),
      })
    ),
    terms: z.string().min(1),
    startDate: z.string(),
    endDate: z.string(),
  }),
});

const signContractSchema = z.object({
  body: z.object({
    signature: z.string().min(1),
  }),
});

const updateContractSchema = z.object({
  body: z.object({
    terms: z.string().optional(),
    paymentSchedule: z.array(
      z.object({
        milestone: z.string(),
        amount: z.number().min(0),
        dueDate: z.string(),
        status: z.string().optional(),
      })
    ).optional(),
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
  requirePermission(Permission.CREATE_CONTRACT),
  validate(createContractSchema),
  controller.createContract
);

router.get(
  '/',
  authenticate,
  requirePermission(Permission.VIEW_CONTRACT),
  filterByCompany,
  controller.getContracts
);

router.get(
  '/:id',
  authenticate,
  requirePermission(Permission.VIEW_CONTRACT),
  controller.getContractById
);

router.post(
  '/:id/sign',
  authenticate,
  requirePermission(Permission.SIGN_CONTRACT),
  validate(signContractSchema),
  controller.signContract
);

router.post(
  '/:id/activate',
  authenticate,
  requirePermission(Permission.UPDATE_CONTRACT),
  controller.activateContract
);

router.patch(
  '/:id',
  authenticate,
  requirePermission(Permission.UPDATE_CONTRACT),
  validate(updateContractSchema),
  controller.updateContract
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(Permission.UPDATE_CONTRACT),
  controller.deleteContract
);

export default router;
