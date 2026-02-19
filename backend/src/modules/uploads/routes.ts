import { Router } from 'express';
import { UploadController } from './controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { Permission } from '../../config/rbac';
import { singleUpload, multipleUpload } from './multer.config';
import { FileCategory } from './types';
import { z } from 'zod';

const router = Router();
const controller = new UploadController();

// Validation schemas
const uploadFileSchema = z.object({
  body: z.object({
    category: z.nativeEnum(FileCategory),
    description: z.string().optional(),
  }),
});

const validateUpload = (req: any, res: any, next: any) => {
  try {
    uploadFileSchema.parse({ body: req.body });
    
    // Additional file validation
    const file = req.file || (req.files && req.files[0]);
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    // Validate file size based on category
    const { category } = req.body;
    let maxSize = 10 * 1024 * 1024; // 10MB default

    if (category === 'profile_image') {
      maxSize = 5 * 1024 * 1024; // 5MB
    }

    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: `File size exceeds limit. Maximum size: ${maxSize / 1024 / 1024}MB`,
      });
    }

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

/**
 * Upload single file
 * POST /api/uploads
 */
router.post(
  '/',
  authenticate,
  requirePermission(Permission.CREATE_BID), // Using existing permission, can add CREATE_UPLOAD later
  singleUpload,
  validateUpload,
  controller.uploadFile
);

/**
 * Upload multiple files
 * POST /api/uploads/multiple
 */
router.post(
  '/multiple',
  authenticate,
  requirePermission(Permission.CREATE_BID),
  multipleUpload,
  validateUpload,
  controller.uploadMultipleFiles
);

/**
 * Get upload by ID
 * GET /api/uploads/:id
 */
router.get(
  '/:id',
  authenticate,
  requirePermission(Permission.VIEW_BID),
  controller.getUploadById
);

/**
 * Get uploads by company
 * GET /api/uploads
 */
router.get(
  '/',
  authenticate,
  requirePermission(Permission.VIEW_BID),
  controller.getUploads
);

/**
 * Delete upload
 * DELETE /api/uploads/:id
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission(Permission.UPDATE_BID),
  controller.deleteUpload
);

/**
 * Get uploads by entity
 * GET /api/uploads/entity/:entityType/:entityId
 */
router.get(
  '/entity/:entityType/:entityId',
  authenticate,
  requirePermission(Permission.VIEW_BID),
  controller.getUploadsByEntity
);

/**
 * Link upload to entity
 * POST /api/uploads/:uploadId/link
 */
router.post(
  '/:uploadId/link',
  authenticate,
  requirePermission(Permission.UPDATE_BID),
  controller.linkUploadToEntity
);

export default router;
