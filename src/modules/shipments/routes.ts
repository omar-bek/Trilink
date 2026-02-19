import { Router } from 'express';
import { ShipmentController } from './controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { Permission } from '../../config/rbac';
import { filterByCompany } from '../../middlewares/ownership.middleware';
import { z } from 'zod';

const router = Router();
const controller = new ShipmentController();

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
  controller.getShipmentById
);

router.patch(
  '/:id/status',
  authenticate,
  requirePermission(Permission.UPDATE_SHIPMENT),
  validate(updateStatusSchema),
  controller.updateShipmentStatus
);

router.patch(
  '/:id/location',
  authenticate,
  requirePermission(Permission.UPDATE_GPS),
  validate(updateLocationSchema),
  controller.updateGPSLocation
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(Permission.UPDATE_SHIPMENT),
  controller.deleteShipment
);

export default router;
