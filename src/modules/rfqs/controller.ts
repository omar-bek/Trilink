import { Request, Response, NextFunction } from 'express';
import { RFQService } from './service';
import { CreateRFQDto, UpdateRFQDto } from './types';
import { ApiResponse } from '../../types/common';
import { getRequestId } from '../../utils/requestId';

export class RFQController {
  private service: RFQService;

  constructor() {
    this.service = new RFQService();
  }

  /**
   * Create a new RFQ
   * POST /api/rfqs
   */
  createRFQ = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data: CreateRFQDto = req.body;
      const rfq = await this.service.createRFQ(req.user.companyId, data);

      const response: ApiResponse = {
        success: true,
        data: rfq,
        requestId: getRequestId(req),
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get RFQ by ID
   * GET /api/rfqs/:id
   */
  getRFQById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const rfq = await this.service.getRFQById(id);

      const response: ApiResponse = {
        success: true,
        data: rfq,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get RFQs by purchase request
   * GET /api/rfqs/purchase-request/:purchaseRequestId
   */
  getRFQsByPurchaseRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { purchaseRequestId } = req.params;
      const rfqs = await this.service.getRFQsByPurchaseRequest(purchaseRequestId);

      const response: ApiResponse = {
        success: true,
        data: rfqs,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get RFQs
   * GET /api/rfqs
   */
  getRFQs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { type, status } = req.query;
      const rfqs = await this.service.getRFQsByCompany(
        req.user.companyId,
        { type: type as string, status: status as string }
      );

      const response: ApiResponse = {
        success: true,
        data: rfqs,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get available RFQs for providers
   * GET /api/rfqs/available
   */
  getAvailableRFQs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { targetCompanyType, type, status } = req.query;
      const rfqs = await this.service.getAvailableRFQs(
        targetCompanyType as any,
        { type: type as string, status: status as string }
      );

      const response: ApiResponse = {
        success: true,
        data: rfqs,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update RFQ
   * PATCH /api/rfqs/:id
   */
  updateRFQ = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const data: UpdateRFQDto = req.body;
      const rfq = await this.service.updateRFQ(id, data);

      const response: ApiResponse = {
        success: true,
        data: rfq,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete RFQ
   * DELETE /api/rfqs/:id
   */
  deleteRFQ = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.deleteRFQ(id);

      const response: ApiResponse = {
        success: true,
        data: { message: 'RFQ deleted successfully' },
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
