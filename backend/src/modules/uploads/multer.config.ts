import multer from 'multer';
import { Request } from 'express';

/**
 * Allowed MIME types by category
 */
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
  all: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
};

/**
 * File size limits (in bytes)
 */
const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  default: 10 * 1024 * 1024, // 10MB
};

/**
 * Configure multer storage (memory storage for S3 upload)
 */
const storage = multer.memoryStorage();

/**
 * File filter function
 */
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const { category } = req.body;

  // Determine allowed MIME types based on category
  let allowedTypes: string[] = ALLOWED_MIME_TYPES.all;

  if (category === 'profile_image') {
    allowedTypes = ALLOWED_MIME_TYPES.image;
  } else if (
    category === 'bid_attachment' ||
    category === 'dispute_attachment' ||
    category === 'company_document' ||
    category === 'contract_document'
  ) {
    allowedTypes = ALLOWED_MIME_TYPES.document;
  }

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      ) as any
    );
  }
};

/**
 * Multer configuration
 */
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.default,
    files: 10, // Max 10 files per request
  },
});

/**
 * Single file upload middleware
 */
export const singleUpload = uploadMiddleware.single('file');

/**
 * Multiple files upload middleware
 */
export const multipleUpload = uploadMiddleware.array('files', 10);

/**
 * Validate file size based on category
 */
export const validateFileSize = (
  file: Express.Multer.File,
  category: string
): boolean => {
  let maxSize = FILE_SIZE_LIMITS.default;

  if (category === 'profile_image') {
    maxSize = FILE_SIZE_LIMITS.image;
  } else if (
    category === 'bid_attachment' ||
    category === 'dispute_attachment' ||
    category === 'company_document' ||
    category === 'contract_document'
  ) {
    maxSize = FILE_SIZE_LIMITS.document;
  }

  return file.size <= maxSize;
};
