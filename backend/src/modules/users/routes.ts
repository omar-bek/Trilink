import { Router } from 'express';
import { UserController } from './controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { Permission } from '../../config/rbac';
import { requireOwnership, requireResourceOwnership } from '../../middlewares/ownership.middleware';
import { UserRepository } from './repository';
import { z } from 'zod';

const router = Router();
const controller = new UserController();
const userRepository = new UserRepository();

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
    role: z.string().optional(),
    customPermissions: z.array(z.string()).optional(),
  }),
});

const updatePermissionsSchema = z.object({
  body: z.object({
    customPermissions: z.array(z.string()),
  }),
});

const updateMyProfileSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    phone: z
      .string()
      .trim()
      .regex(
        /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}[-\s\.]?[0-9]{1,9}$/,
        'Invalid phone number format'
      )
      .optional(),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
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
  requireOwnership('companyId'), // Enforce company isolation
  validate(createUserSchema),
  controller.createUser
);

// Get all users (admin only) - must be before /company/:companyId route
router.get(
  '/',
  authenticate,
  requirePermission(Permission.VIEW_USERS),
  controller.getAllUsers
);

router.get(
  '/company/:companyId',
  authenticate,
  requirePermission(Permission.VIEW_USERS),
  requireOwnership('companyId'), // Enforce company isolation
  controller.getUsersByCompany
);

// Self-update profile endpoint (must be before /:id route)
router.patch(
  '/me',
  authenticate,
  validate(updateMyProfileSchema),
  controller.updateMyProfile
);

router.get(
  '/:id',
  authenticate,
  // Allow users to view users in their company (checked by requireResourceOwnership)
  // Admin and Government bypass company isolation in requireResourceOwnership
  requireResourceOwnership(
    async (id: string) => {
      const user = await userRepository.findById(id);
      // Convert ObjectId to string for comparison
      if (user && user.companyId) {
        return {
          companyId: user.companyId.toString(),
        } as { companyId: string };
      }
      return null;
    },
    'id',
    'companyId'
  ),
  controller.getUserById
);

router.patch(
  '/:id',
  authenticate,
  requirePermission(Permission.MANAGE_USERS),
  requireResourceOwnership(
    async (id: string) => {
      const user = await userRepository.findById(id);
      if (user && user.companyId) {
        return {
          companyId: user.companyId.toString(),
        } as { companyId: string };
      }
      return null;
    },
    'id',
    'companyId'
  ),
  validate(updateUserSchema),
  controller.updateUser
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(Permission.MANAGE_USERS),
  requireResourceOwnership(
    async (id: string) => {
      const user = await userRepository.findById(id);
      if (user && user.companyId) {
        return {
          companyId: user.companyId.toString(),
        } as { companyId: string };
      }
      return null;
    },
    'id',
    'companyId'
  ),
  controller.deleteUser
);

// Change password endpoint (must be before /:id route to avoid conflict)
router.post(
  '/:id/change-password',
  authenticate,
  validate(changePasswordSchema),
  controller.changePassword
);

// Update user permissions endpoint
router.patch(
  '/:id/permissions',
  authenticate,
  requirePermission(Permission.MANAGE_USERS),
  requireResourceOwnership(
    async (id: string) => {
      const user = await userRepository.findById(id);
      if (user && user.companyId) {
        return {
          companyId: user.companyId.toString(),
        } as { companyId: string };
      }
      return null;
    },
    'id',
    'companyId'
  ),
  validate(updatePermissionsSchema),
  controller.updateUserPermissions
);

export default router;
