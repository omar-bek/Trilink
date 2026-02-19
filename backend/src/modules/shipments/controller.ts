import { Request, Response, NextFunction } from 'express';
import { ShipmentService } from './service';
import {
  CreateShipmentDto,
  UpdateShipmentStatusDto,
  UpdateGPSLocationDto,
  InspectShipmentDto,
  ShipmentResponse,
  SubmitCustomsDocumentsDto,
  UpdateCustomsClearanceStatusDto,
  ResubmitCustomsDocumentsDto,
} from './types';
import { ApiResponse, PaginatedResponse } from '../../types/common';
import { getRequestId } from '../../utils/requestId';
import { Role } from '../../config/rbac';

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
   * Supports pagination: ?page=1&limit=20&sortBy=createdAt&sortOrder=desc
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

      const { status, contractId, page, limit, sortBy, sortOrder } = req.query;
      
      // If contractId is provided, get shipments by contract
      if (contractId) {
        const shipments = await this.service.getShipmentsByContract(contractId as string);
        const response: ApiResponse = {
          success: true,
          data: shipments,
          requestId: getRequestId(req),
        };
        res.status(200).json(response);
        return;
      }
      
      if (page || limit) {
        const result = await this.service.getShipmentsByCompanyPaginated(
          req.user.companyId,
          { status: status as string },
          { page: page as string, limit: limit as string, sortBy: sortBy as string, sortOrder: sortOrder as 'asc' | 'desc' }
        );

        const response: ApiResponse<PaginatedResponse<ShipmentResponse>> = {
          success: true,
          data: result,
          requestId: getRequestId(req),
        };

        res.status(200).json(response);
      } else {
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
      }
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
   * Only Logistics role can update GPS
   */
  updateGPSLocation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const data: UpdateGPSLocationDto = req.body;
      const requesterRole = req.user.role as Role;
      const requesterCompanyId = req.user.companyId;
      const shipment = await this.service.updateGPSLocation(
        id,
        req.user.userId,
        data,
        requesterRole,
        requesterCompanyId
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
   * Inspect shipment (Buyer only)
   * POST /api/shipments/:id/inspect
   */
  inspectShipment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const data: InspectShipmentDto = req.body;
      const shipment = await this.service.inspectShipment(
        id,
        req.user.userId,
        req.user.companyId,
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
   * Submit customs documents
   * POST /api/shipments/:id/customs/documents
   */
  submitCustomsDocuments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const data: SubmitCustomsDocumentsDto = req.body;
      const shipment = await this.service.submitCustomsDocuments(
        id,
        req.user.userId,
        req.user.companyId,
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
   * Update customs clearance status (Government/Admin only)
   * PATCH /api/shipments/:id/customs/status
   */
  updateCustomsClearanceStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const data: UpdateCustomsClearanceStatusDto = req.body;
      const shipment = await this.service.updateCustomsClearanceStatus(
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
   * Resubmit customs documents after rejection
   * POST /api/shipments/:id/customs/resubmit
   */
  resubmitCustomsDocuments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const data: ResubmitCustomsDocumentsDto = req.body;
      const shipment = await this.service.resubmitCustomsDocuments(
        id,
        req.user.userId,
        req.user.companyId,
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
