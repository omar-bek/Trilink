import { Request, Response, NextFunction } from 'express';
import { DisputeService } from './service';
import {
  CreateDisputeDto,
  UpdateDisputeDto,
  EscalateDisputeDto,
} from './types';
import { ApiResponse } from '../../types/common';
import { getRequestId } from '../../utils/requestId';

export class DisputeController {
  private service: DisputeService;

  constructor() {
    this.service = new DisputeService();
  }

  /**
   * Create a new dispute
   * POST /api/disputes
   */
  createDispute = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data: CreateDisputeDto = req.body;
      const dispute = await this.service.createDispute(
        req.user.companyId,
        req.user.userId,
        data
      );

      const response: ApiResponse = {
        success: true,
        data: dispute,
        requestId: getRequestId(req),
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get dispute by ID
   * GET /api/disputes/:id
   */
  getDisputeById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const dispute = await this.service.getDisputeById(id);

      const response: ApiResponse = {
        success: true,
        data: dispute,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get disputes
   * GET /api/disputes
   */
  getDisputes = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { status, escalated } = req.query;
      const disputes = await this.service.getDisputesByCompany(
        req.user.companyId,
        { status: status as string, escalated: escalated === 'true' }
      );

      const response: ApiResponse = {
        success: true,
        data: disputes,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get escalated disputes (government only)
   * GET /api/disputes/escalated
   */
  getEscalatedDisputes = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const disputes = await this.service.getEscalatedDisputes();

      const response: ApiResponse = {
        success: true,
        data: disputes,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Escalate dispute to government
   * POST /api/disputes/:id/escalate
   */
  escalateDispute = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const data: EscalateDisputeDto = req.body;
      const dispute = await this.service.escalateDispute(id, data);

      const response: ApiResponse = {
        success: true,
        data: dispute,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Resolve dispute
   * POST /api/disputes/:id/resolve
   */
  resolveDispute = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { resolution } = req.body;
      const dispute = await this.service.resolveDispute(id, resolution);

      const response: ApiResponse = {
        success: true,
        data: dispute,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update dispute
   * PATCH /api/disputes/:id
   */
  updateDispute = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const data: UpdateDisputeDto = req.body;
      const dispute = await this.service.updateDispute(id, data);

      const response: ApiResponse = {
        success: true,
        data: dispute,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete dispute
   * DELETE /api/disputes/:id
   */
  deleteDispute = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.deleteDispute(id);

      const response: ApiResponse = {
        success: true,
        data: { message: 'Dispute deleted successfully' },
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
