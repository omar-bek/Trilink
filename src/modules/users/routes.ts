import { Router } from 'express';
import { UserController } from './controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { Permission } from '../../config/rbac';
import { requireOwnership } from '../../middlewares/ownership.middleware';
import { z } from 'zod';

const router = Router();
const controller = new UserController();

// Validation schemas
const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    role: z.string(),
    companyId: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
  }),
});

const updateUserSchema = z.object({
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
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
  requirePermission(Permission.MANAGE_USERS),
  validate(createUserSchema),
  controller.createUser
);

router.get(
  '/:id',
  authenticate,
  requirePermission(Permission.VIEW_USERS),
  controller.getUserById
);

router.get(
  '/company/:companyId',
  authenticate,
  requirePermission(Permission.VIEW_USERS),
  controller.getUsersByCompany
);

router.patch(
  '/:id',
  authenticate,
  requirePermission(Permission.MANAGE_USERS),
  validate(updateUserSchema),
  controller.updateUser
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(Permission.MANAGE_USERS),
  controller.deleteUser
);

export default router;
