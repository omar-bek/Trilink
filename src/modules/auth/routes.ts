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

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
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

export default router;
