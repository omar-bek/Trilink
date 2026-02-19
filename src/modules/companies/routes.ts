import { Router } from 'express';
import { CompanyController } from './controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { Permission } from '../../config/rbac';
import { z } from 'zod';

const router = Router();
const controller = new CompanyController();

// Validation schemas
const createCompanySchema = z.object({
  body: z.object({
    name: z.string().min(1),
    registrationNumber: z.string().min(1),
    type: z.string(),
    email: z.string().email(),
    phone: z.string().min(1),
    address: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      country: z.string(),
      zipCode: z.string(),
    }),
    documents: z.array(z.object({
      type: z.string(),
      url: z.string(),
    })).optional(),
  }),
});

const updateCompanySchema = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      zipCode: z.string().optional(),
    }).optional(),
    documents: z.array(z.object({
      type: z.string(),
      url: z.string(),
    })).optional(),
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
  requirePermission(Permission.MANAGE_COMPANIES),
  validate(createCompanySchema),
  controller.createCompany
);

router.get(
  '/',
  authenticate,
  requirePermission(Permission.VIEW_COMPANIES),
  controller.getCompanies
);

router.get(
  '/:id',
  authenticate,
  requirePermission(Permission.VIEW_COMPANIES),
  controller.getCompanyById
);

router.patch(
  '/:id',
  authenticate,
  requirePermission(Permission.MANAGE_COMPANIES),
  validate(updateCompanySchema),
  controller.updateCompany
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(Permission.MANAGE_COMPANIES),
  controller.deleteCompany
);

router.post(
  '/:id/documents',
  authenticate,
  requirePermission(Permission.MANAGE_COMPANIES),
  controller.addDocument
);

export default router;
