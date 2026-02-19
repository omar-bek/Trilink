import { Router } from 'express';
import { AuthController } from './controller';
import { authRateLimiter } from '../../middlewares/rateLimit.middleware';
import { z } from 'zod';

const router = Router();
const controller = new AuthController();

// Validation schemas
const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

const registerCompanySchema = z.object({
  body: z.object({
    // Company information
    companyName: z.string().min(1, 'Company name is required'),
    registrationNumber: z.string().min(1, 'Registration number is required'),
    companyType: z.enum(['Buyer', 'Supplier', 'Logistics', 'Clearance', 'Service Provider', 'Government']),
    companyEmail: z.string().email('Invalid company email'),
    companyPhone: z.string().min(1, 'Company phone is required'),
    address: z.object({
      street: z.string().min(1, 'Street is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      country: z.string().min(1, 'Country is required'),
      zipCode: z.string().min(1, 'Zip code is required'),
    }),
    documents: z.array(z.object({
      type: z.string(),
      url: z.string().url(),
    })).optional(),
    categoryIds: z.array(z.string()).optional(), // Optional category IDs
    // User information
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
  }),
});

const registerSchema = z.object({
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

// Refresh token schema - no body required, token comes from httpOnly cookie
const refreshTokenSchema = z.object({
  body: z.object({}).optional(), // Empty body - refreshToken from cookie
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
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
  '/register-company',
  authRateLimiter,
  validate(registerCompanySchema),
  controller.registerCompany
);

router.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  controller.register
);

router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  controller.login
);

router.post(
  '/refresh',
  validate(refreshTokenSchema),
  controller.refreshToken
);

router.post(
  '/forgot-password',
  authRateLimiter,
  validate(forgotPasswordSchema),
  controller.forgotPassword
);

router.post(
  '/reset-password',
  authRateLimiter,
  validate(resetPasswordSchema),
  controller.resetPassword
);

router.post(
  '/logout',
  controller.logout
);

export default router;
