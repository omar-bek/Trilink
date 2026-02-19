import { Router } from 'express';
import { PurchaseRequestController } from './controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { Permission, Role } from '../../config/rbac';
import { requireOwnership, requireResourceOwnership, filterByCompany } from '../../middlewares/ownership.middleware';
import { enforceCategoryAccess } from '../../middlewares/category-access.middleware';
import { filterByCategorySpecialization } from '../../middlewares/category-filter.middleware';
import { PurchaseRequestRepository } from './repository';
import { z } from 'zod';

const router = Router();
const controller = new PurchaseRequestController();
const purchaseRequestRepository = new PurchaseRequestRepository();

// Validation schemas
const createPurchaseRequestSchema = z.object({
  body: z.object({
    categoryId: z.string().min(1, 'Category is required'),
    subCategoryId: z.string().optional(),
    title: z.string().min(1),
    description: z.string().min(1),
    items: z.array(
      z.object({
        name: z.string(),
        quantity: z.number().min(1),
        unit: z.string(),
        specifications: z.string(),
        estimatedPrice: z.number().optional(),
      })
    ).min(1),
    budget: z.number().min(0),
    currency: z.string().optional(),
    deliveryLocation: z.object({
      address: z.string(),
      city: z.string(),
      state: z.string(),
      country: z.string(),
      zipCode: z.string(),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number(),
      }).optional(),
    }),
    requiredDeliveryDate: z.string(),
  }),
});

const updatePurchaseRequestSchema = z.object({
  body: z.object({
    categoryId: z.string().optional(),
    subCategoryId: z.string().optional().nullable(),
    title: z.string().optional(),
    description: z.string().optional(),
    items: z.array(
      z.object({
        name: z.string(),
        quantity: z.coerce.number().min(1),
        unit: z.string(),
        specifications: z.string(),
        estimatedPrice: z.coerce.number().optional().nullable(),
      })
    ).optional(),
    budget: z.preprocess(
      (val) => (val === '' || val === null ? undefined : val),
      z.coerce.number().min(0).optional()
    ),
    currency: z.string().optional(),
    deliveryLocation: z.object({
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      zipCode: z.string().optional(),
      coordinates: z.preprocess(
        (val) => {
          // If coordinates object is provided, validate lat and lng
          if (val && typeof val === 'object' && val !== null && !Array.isArray(val)) {
            const coordObj = val as { lat?: unknown; lng?: unknown };
            const lat = coordObj.lat;
            const lng = coordObj.lng;
            // If both are invalid/empty, return undefined to remove coordinates
            if (
              (lat === '' || lat === null || lat === undefined || isNaN(Number(lat))) &&
              (lng === '' || lng === null || lng === undefined || isNaN(Number(lng)))
            ) {
              return undefined;
            }
            // If one is valid and one is not, return undefined (both must be valid)
            if (
              lat === '' || lat === null || lat === undefined || isNaN(Number(lat)) ||
              lng === '' || lng === null || lng === undefined || isNaN(Number(lng))
            ) {
              return undefined;
            }
            // Both are valid, return as numbers
            return {
              lat: Number(lat),
              lng: Number(lng),
            };
          }
          return val;
        },
        z.object({
          lat: z.number(),
          lng: z.number(),
        }).optional().nullable()
      ),
    }).optional().nullable(),
    requiredDeliveryDate: z.string().optional(),
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
        const errorMessages = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: `Validation failed: ${errorMessages.map(e => `${e.field}: ${e.message}`).join(', ')}`,
          errors: errorMessages,
        });
      } else {
        next(error);
      }
    }
  };
};

// Routes
// Buyer and Company Manager routes: Create, Update, Submit Purchase Requests
router.post(
  '/',
  authenticate,
  requireRole(Role.BUYER, Role.COMPANY_MANAGER), // Buyer and Company Manager can create
  requirePermission(Permission.CREATE_PURCHASE_REQUEST),
  requireOwnership('companyId'), // Company isolation
  validate(createPurchaseRequestSchema),
  controller.createPurchaseRequest
);

router.get(
  '/',
  authenticate,
  requireRole(Role.BUYER, Role.COMPANY_MANAGER, Role.ADMIN, Role.GOVERNMENT), // Buyer, Company Manager, Admin, and Government can view
  requirePermission(Permission.VIEW_PURCHASE_REQUEST),
  filterByCompany, // Company isolation
  filterByCategorySpecialization, // SECURITY FIX: Filter by category specialization
  controller.getPurchaseRequests
);

// Helper function to convert IPurchaseRequest to format expected by requireResourceOwnership
const fetchPurchaseRequestForOwnership = async (id: string) => {
  const purchaseRequest = await purchaseRequestRepository.findById(id);
  if (!purchaseRequest) return null;
  return {
    companyId: purchaseRequest.companyId.toString(),
  };
};

router.get(
  '/:id',
  authenticate,
  requireRole(Role.BUYER, Role.COMPANY_MANAGER, Role.ADMIN, Role.GOVERNMENT), // Buyer, Company Manager, Admin, and Government can view
  requirePermission(Permission.VIEW_PURCHASE_REQUEST),
  enforceCategoryAccess, // Enforce category-based access control
  requireResourceOwnership(
    fetchPurchaseRequestForOwnership,
    'id',
    'companyId'
  ),
  controller.getPurchaseRequestById
);

router.patch(
  '/:id',
  authenticate,
  requireRole(Role.BUYER, Role.COMPANY_MANAGER), // Buyer and Company Manager can update
  requirePermission(Permission.UPDATE_PURCHASE_REQUEST),
  requireResourceOwnership(
    fetchPurchaseRequestForOwnership,
    'id',
    'companyId'
  ),
  validate(updatePurchaseRequestSchema),
  controller.updatePurchaseRequest
);

router.post(
  '/:id/submit',
  authenticate,
  requireRole(Role.BUYER, Role.COMPANY_MANAGER), // Buyer and Company Manager can submit
  requirePermission(Permission.UPDATE_PURCHASE_REQUEST),
  requireResourceOwnership(
    fetchPurchaseRequestForOwnership,
    'id',
    'companyId'
  ),
  controller.submitPurchaseRequest
);

// Admin/Approver routes
// Admin, Government, and Company Manager can approve purchase requests
router.post(
  '/:id/approve',
  authenticate,
  requirePermission(Permission.APPROVE_PURCHASE_REQUEST),
  // Company managers can only approve purchase requests from their own company (enforced in service)
  controller.approvePurchaseRequest
);

router.delete(
  '/:id',
  authenticate,
  requireRole(Role.BUYER, Role.COMPANY_MANAGER), // Buyer and Company Manager can delete
  requirePermission(Permission.DELETE_PURCHASE_REQUEST),
  requireResourceOwnership(
    fetchPurchaseRequestForOwnership,
    'id',
    'companyId'
  ),
  controller.deletePurchaseRequest
);

export default router;
