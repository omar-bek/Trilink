import { Request, Response, NextFunction } from 'express';
import { PurchaseRequestService } from './service';
import {
  CreatePurchaseRequestDto,
  UpdatePurchaseRequestDto,
} from './types';
import { ApiResponse } from '../../types/common';
import { getRequestId } from '../../utils/requestId';

export class PurchaseRequestController {
  private service: PurchaseRequestService;

  constructor() {
    this.service = new PurchaseRequestService();
  }

  /**
   * Create a new purchase request
   * POST /api/purchase-requests
   */
  createPurchaseRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data: CreatePurchaseRequestDto = req.body;
      const purchaseRequest = await this.service.createPurchaseRequest(
        req.user.userId,
        req.user.companyId,
        data
      );

      const response: ApiResponse = {
        success: true,
        data: purchaseRequest,
        requestId: getRequestId(req),
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get purchase request by ID
   * GET /api/purchase-requests/:id
   */
  getPurchaseRequestById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const purchaseRequest = await this.service.getPurchaseRequestById(id);

      const response: ApiResponse = {
        success: true,
        data: purchaseRequest,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get purchase requests
   * GET /api/purchase-requests
   */
  getPurchaseRequests = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { status, buyerId } = req.query;
      const purchaseRequests = await this.service.getPurchaseRequestsByCompany(
        req.user.companyId,
        { status: status as string, buyerId: buyerId as string }
      );

      const response: ApiResponse = {
        success: true,
        data: purchaseRequests,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update purchase request
   * PATCH /api/purchase-requests/:id
   */
  updatePurchaseRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const data: UpdatePurchaseRequestDto = req.body;
      const purchaseRequest = await this.service.updatePurchaseRequest(id, data);

      const response: ApiResponse = {
        success: true,
        data: purchaseRequest,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Approve purchase request and generate RFQs
   * POST /api/purchase-requests/:id/approve
   */
  approvePurchaseRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const purchaseRequest = await this.service.approvePurchaseRequest(id);

      const response: ApiResponse = {
        success: true,
        data: purchaseRequest,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete purchase request
   * DELETE /api/purchase-requests/:id
   */
  deletePurchaseRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.deletePurchaseRequest(id);

      const response: ApiResponse = {
        success: true,
        data: { message: 'Purchase request deleted successfully' },
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
