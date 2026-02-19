import { Router } from 'express';
import { ContractController } from './controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission, requireRole } from '../../middlewares/rbac.middleware';
import { Permission, Role } from '../../config/rbac';
import { filterByCompany, requireResourceOwnership } from '../../middlewares/ownership.middleware';
import { ContractRepository } from './repository';
import { z } from 'zod';

const router = Router();
const controller = new ContractController();
const contractRepository = new ContractRepository();

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
    certificate: z.string().optional(),
    algorithm: z.string().optional(),
    timestamp: z.string().optional(),
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

const createAmendmentSchema = z.object({
  body: z.object({
    reason: z.string().min(1),
    description: z.string().min(1),
    changes: z.object({
      terms: z.string().optional(),
      amounts: z
        .object({
          total: z.number().min(0).optional(),
          currency: z.string().optional(),
          breakdown: z
            .array(
              z.object({
                partyId: z.string(),
                amount: z.number().min(0),
                description: z.string(),
              })
            )
            .optional(),
        })
        .optional(),
      paymentSchedule: z
        .array(
          z.object({
            milestone: z.string(),
            amount: z.number().min(0),
            dueDate: z.string(),
            status: z.string().optional(),
          })
        )
        .optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }),
  }),
});

const approveAmendmentSchema = z.object({
  body: z.object({
    approved: z.boolean(),
    comments: z.string().optional(),
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
  requireRole(Role.BUYER, Role.COMPANY_MANAGER), // Buyer and Company Manager can create contracts
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
  '/:id/pdf',
  authenticate,
  requirePermission(Permission.VIEW_CONTRACT),
  // Note: Access is checked in controller to allow buyer OR parties
  controller.getContractPdf
);

router.get(
  '/:id',
  authenticate,
  requirePermission(Permission.VIEW_CONTRACT),
  // Note: Company ownership is checked in service layer
  // to allow access if user's company is buyer OR one of the parties
  controller.getContractById
);

router.post(
  '/:id/sign',
  authenticate,
  requireRole(Role.COMPANY_MANAGER, Role.ADMIN), // Only Company Manager and Admin can sign contracts
  requirePermission(Permission.SIGN_CONTRACT),
  // Note: Company Manager can sign contracts for their company
  // Company isolation is handled in controller to check if user's company is a party
  validate(signContractSchema),
  controller.signContract
);

router.post(
  '/:id/verify-signature',
  authenticate,
  requirePermission(Permission.VIEW_CONTRACT),
  // Note: Signature verification is allowed for buyer or parties
  // Access is checked in service layer
  controller.verifySignature
);

router.post(
  '/:id/activate',
  authenticate,
  requirePermission(Permission.UPDATE_CONTRACT),
  requireResourceOwnership(
    (id) => contractRepository.findById(id),
    'id',
    'buyerCompanyId'
  ),
  controller.activateContract
);

router.patch(
  '/:id',
  authenticate,
  requirePermission(Permission.UPDATE_CONTRACT),
  requireResourceOwnership(
    (id) => contractRepository.findById(id),
    'id',
    'buyerCompanyId'
  ),
  validate(updateContractSchema),
  controller.updateContract
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(Permission.UPDATE_CONTRACT),
  requireResourceOwnership(
    (id) => contractRepository.findById(id),
    'id',
    'buyerCompanyId'
  ),
  controller.deleteContract
);

// Amendment routes
router.post(
  '/:id/amendments',
  authenticate,
  requirePermission(Permission.UPDATE_CONTRACT),
  requireResourceOwnership(
    (id) => contractRepository.findById(id),
    'id',
    'buyerCompanyId'
  ),
  validate(createAmendmentSchema),
  controller.createAmendment
);

router.get(
  '/:id/amendments',
  authenticate,
  requirePermission(Permission.VIEW_CONTRACT),
  // Note: Access is checked in service to allow buyer OR parties
  controller.getContractAmendments
);

router.get(
  '/:id/amendments/:amendmentId',
  authenticate,
  requirePermission(Permission.VIEW_CONTRACT),
  // Note: Access is checked in service to allow buyer OR parties
  controller.getAmendmentById
);

router.post(
  '/:id/amendments/:amendmentId/approve',
  authenticate,
  requireRole(Role.COMPANY_MANAGER, Role.ADMIN), // Only Company Manager and Admin can approve amendments
  requirePermission(Permission.SIGN_CONTRACT),
  // Note: Company Manager can approve amendments for their company
  // Company isolation is handled in controller to check if user's company is a party
  validate(approveAmendmentSchema),
  controller.approveAmendment
);

// Version history routes
router.get(
  '/:id/versions',
  authenticate,
  requirePermission(Permission.VIEW_CONTRACT),
  // Note: Access is checked in service to allow buyer OR parties
  controller.getVersionHistory
);

router.get(
  '/:id/versions/:version',
  authenticate,
  requirePermission(Permission.VIEW_CONTRACT),
  // Note: Access is checked in service to allow buyer OR parties
  controller.getContractVersion
);

router.get(
  '/:id/versions/compare',
  authenticate,
  requirePermission(Permission.VIEW_CONTRACT),
  // Note: Access is checked in service to allow buyer OR parties
  controller.compareVersions
);

export default router;
