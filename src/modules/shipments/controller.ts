import { Request, Response, NextFunction } from 'express';
import { ShipmentService } from './service';
import {
  CreateShipmentDto,
  UpdateShipmentStatusDto,
  UpdateGPSLocationDto,
} from './types';
import { ApiResponse } from '../../types/common';
import { getRequestId } from '../../utils/requestId';

export class ShipmentController {
  private service: ShipmentService;

  constructor() {
    this.service = new ShipmentService();
  }

  /**
   * Create a new shipment
   * POST /api/shipments
   */
  createShipment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data: CreateShipmentDto = req.body;
      const shipment = await this.service.createShipment(
        req.user.companyId,
        data
      );

      const response: ApiResponse = {
        success: true,
        data: shipment,
        requestId: getRequestId(req),
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get shipment by ID
   * GET /api/shipments/:id
   */
  getShipmentById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const shipment = await this.service.getShipmentById(id);

      const response: ApiResponse = {
        success: true,
        data: shipment,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get shipments
   * GET /api/shipments
   */
  getShipments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { status } = req.query;
      const shipments = await this.service.getShipmentsByCompany(
        req.user.companyId,
        { status: status as string }
      );

      const response: ApiResponse = {
        success: true,
        data: shipments,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update shipment status
   * PATCH /api/shipments/:id/status
   */
  updateShipmentStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const data: UpdateShipmentStatusDto = req.body;
      const shipment = await this.service.updateShipmentStatus(
        id,
        req.user.userId,
        data
      );

      const response: ApiResponse = {
        success: true,
        data: shipment,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update GPS location
   * PATCH /api/shipments/:id/location
   */
  updateGPSLocation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const data: UpdateGPSLocationDto = req.body;
      const shipment = await this.service.updateGPSLocation(id, data);

      const response: ApiResponse = {
        success: true,
        data: shipment,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete shipment
   * DELETE /api/shipments/:id
   */
  deleteShipment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.deleteShipment(id);

      const response: ApiResponse = {
        success: true,
        data: { message: 'Shipment deleted successfully' },
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
