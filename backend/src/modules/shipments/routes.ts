import { Router } from 'express';
import { ShipmentController } from './controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { Permission, Role } from '../../config/rbac';
import { filterByCompany, requireResourceOwnership } from '../../middlewares/ownership.middleware';
import { ShipmentRepository } from './repository';
import { z } from 'zod';

const router = Router();
const controller = new ShipmentController();
const shipmentRepository = new ShipmentRepository();

// Validation schemas
const createShipmentSchema = z.object({
  body: z.object({
    contractId: z.string(),
    logisticsCompanyId: z.string(),
    origin: z.object({
      address: z.string(),
      city: z.string(),
      country: z.string(),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
    }),
    destination: z.object({
      address: z.string(),
      city: z.string(),
      country: z.string(),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
    }),
    estimatedDeliveryDate: z.string(),
  }),
});

const updateStatusSchema = z.object({
  body: z.object({
    status: z.string(),
    description: z.string().min(1),
    location: z.object({
      address: z.string(),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
    }).optional(),
  }),
});

const updateLocationSchema = z.object({
  body: z.object({
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
    address: z.string(),
  }),
});

const inspectShipmentSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'approved', 'rejected']),
    rejectionReason: z.string().optional(),
  }),
});

const submitCustomsDocumentsSchema = z.object({
  body: z.object({
    documentIds: z.array(z.string()).min(1, 'At least one document is required'),
    documentTypes: z.array(z.string()).min(1, 'At least one document type is required'),
  }),
});

const updateCustomsClearanceStatusSchema = z.object({
  body: z.object({
    status: z.enum(['not_required', 'pending', 'documents_submitted', 'under_review', 'approved', 'rejected', 'resubmitted']),
    description: z.string().min(1),
    rejectionReason: z.string().optional(),
    customsAuthority: z.string().optional(),
  }),
});

const resubmitCustomsDocumentsSchema = z.object({
  body: z.object({
    documentIds: z.array(z.string()).min(1, 'At least one document is required'),
    documentTypes: z.array(z.string()).min(1, 'At least one document type is required'),
    notes: z.string().optional(),
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
  requirePermission(Permission.CREATE_SHIPMENT),
  validate(createShipmentSchema),
  controller.createShipment
);

router.get(
  '/',
  authenticate,
  requirePermission(Permission.VIEW_SHIPMENT),
  filterByCompany,
  controller.getShipments
);

router.get(
  '/:id',
  authenticate,
  requirePermission(Permission.VIEW_SHIPMENT),
  requireResourceOwnership(
    (id) => shipmentRepository.findById(id),
    'id',
    'companyId'
  ),
  controller.getShipmentById
);

router.patch(
  '/:id/status',
  authenticate,
  requirePermission(Permission.UPDATE_SHIPMENT),
  requireResourceOwnership(
    (id) => shipmentRepository.findById(id),
    'id',
    'companyId'
  ),
  validate(updateStatusSchema),
  controller.updateShipmentStatus
);

router.patch(
  '/:id/location',
  authenticate,
  requireRole(Role.LOGISTICS), // Only Logistics can update GPS
  requirePermission(Permission.UPDATE_GPS),
  // Logistics can update GPS for shipments they're handling (check in controller)
  validate(updateLocationSchema),
  controller.updateGPSLocation
);

router.post(
  '/:id/inspect',
  authenticate,
  requireRole(Role.BUYER), // Only Buyer can inspect shipments
  requireResourceOwnership(
    (id) => shipmentRepository.findById(id),
    'id',
    'companyId'
  ),
  validate(inspectShipmentSchema),
  controller.inspectShipment
);

router.post(
  '/:id/customs/documents',
  authenticate,
  requirePermission(Permission.UPDATE_SHIPMENT),
  requireResourceOwnership(
    (id) => shipmentRepository.findById(id),
    'id',
    'companyId'
  ),
  validate(submitCustomsDocumentsSchema),
  controller.submitCustomsDocuments
);

router.patch(
  '/:id/customs/status',
  authenticate,
  requireRole(Role.GOVERNMENT, Role.ADMIN), // Only Government/Admin can update customs status
  requirePermission(Permission.UPDATE_SHIPMENT),
  validate(updateCustomsClearanceStatusSchema),
  controller.updateCustomsClearanceStatus
);

router.post(
  '/:id/customs/resubmit',
  authenticate,
  requirePermission(Permission.UPDATE_SHIPMENT),
  requireResourceOwnership(
    (id) => shipmentRepository.findById(id),
    'id',
    'companyId'
  ),
  validate(resubmitCustomsDocumentsSchema),
  controller.resubmitCustomsDocuments
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(Permission.UPDATE_SHIPMENT),
  requireResourceOwnership(
    (id) => shipmentRepository.findById(id),
    'id',
    'companyId'
  ),
  controller.deleteShipment
);

export default router;
