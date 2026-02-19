import { Request, Response, NextFunction } from 'express';
import { DisputeService } from './service';
import {
  CreateDisputeDto,
  UpdateDisputeDto,
  EscalateDisputeDto,
  AddAttachmentDto,
  ResolveDisputeDto,
  AssignDisputeDto,
  DisputeResponse,
} from './types';
import { ApiResponse, PaginatedResponse } from '../../types/common';
import { getRequestId } from '../../utils/requestId';
import { Role } from '../../config/rbac';

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
   * Government can see all disputes, others see only their company's disputes
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

      const { status, escalated, page, limit, sortBy, sortOrder } = req.query;
      const requesterRole = req.user.role as Role;

      if (page || limit) {
        // Pagination requested
        const result = await this.service.getDisputesByCompanyPaginated(
          req.user.companyId,
          {
            status: status as string,
            escalated: escalated === 'true',
          },
          { page: page as string, limit: limit as string, sortBy: sortBy as string, sortOrder: sortOrder as 'asc' | 'desc' }
        );

        const response: ApiResponse<PaginatedResponse<DisputeResponse>> = {
          success: true,
          data: result,
          requestId: getRequestId(req),
        };

        res.status(200).json(response);
      } else {
        // Backward compatibility
        let disputes;
        if (requesterRole === Role.GOVERNMENT || requesterRole === Role.ADMIN) {
          disputes = await this.service.getAllDisputes({
            status: status as string,
            escalated: escalated === 'true',
          });
        } else {
          disputes = await this.service.getDisputesByCompany(
            req.user.companyId,
            { status: status as string, escalated: escalated === 'true' }
          );
        }

        const response: ApiResponse = {
          success: true,
          data: disputes,
          requestId: getRequestId(req),
        };

        res.status(200).json(response);
      }
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
   * Get disputes assigned to the current user
   * GET /api/disputes/assigned-to-me
   */
  getDisputesAssignedToMe = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { status } = req.query;
      const disputes = await this.service.getDisputesAssignedToMe(req.user.userId, {
        status: status as string,
      });

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
   * Resolve dispute (Government only)
   * POST /api/disputes/:id/resolve
   */
  resolveDispute = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const data: ResolveDisputeDto = req.body;
      const requesterRole = req.user.role as Role;
      const dispute = await this.service.resolveDispute(id, data, requesterRole);

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
   * Add attachments to dispute
   * POST /api/disputes/:id/attachments
   */
  addAttachments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const data: AddAttachmentDto = req.body;
      const dispute = await this.service.addAttachments(id, data);

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
   * Assign or reassign dispute to a government user
   * POST /api/disputes/:id/assign
   */
  assignDispute = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const data: AssignDisputeDto = req.body;
      const dispute = await this.service.assignDispute(id, data, req.user.userId);

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
