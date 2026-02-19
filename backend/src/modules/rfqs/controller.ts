import { Request, Response, NextFunction } from 'express';
import { RFQService } from './service';
import { CreateRFQDto, UpdateRFQDto } from './types';
import { ApiResponse, PaginatedResponse } from '../../types/common';
import { getRequestId } from '../../utils/requestId';
import { RFQResponse } from './types';

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
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const rfq = await this.service.getRFQById(id, req.user.companyId);

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
   * Supports pagination: ?page=1&limit=20&sortBy=createdAt&sortOrder=desc
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

      const { type, status, page, limit, sortBy, sortOrder } = req.query;
      
      // Check if pagination is requested
      if (page || limit) {
        const result = await this.service.getRFQsByCompanyPaginated(
          req.user.companyId,
          { type: type as string, status: status as string },
          { page: page as string, limit: limit as string, sortBy: sortBy as string, sortOrder: sortOrder as 'asc' | 'desc' }
        );

        const response: ApiResponse<PaginatedResponse<RFQResponse>> = {
          success: true,
          data: result,
          requestId: getRequestId(req),
        };

        res.status(200).json(response);
      } else {
        // Backward compatibility: return all results
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
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get available RFQs for providers
   * GET /api/rfqs/available
   * Supports pagination: ?page=1&limit=20&sortBy=deadline&sortOrder=asc
   */
  getAvailableRFQs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { targetRole, type, status, page, limit, sortBy, sortOrder } = req.query;
      
      // Use targetRole if provided, otherwise fall back to targetCompanyType
      if (targetRole) {
        const requesterCompanyId = req.user?.companyId;
        if (page || limit) {
          const result = await this.service.getAvailableRFQsByRolePaginated(
            targetRole as any,
            { type: type as string, status: status as string },
            { page: page as string, limit: limit as string, sortBy: sortBy as string, sortOrder: sortOrder as 'asc' | 'desc' },
            requesterCompanyId
          );

          const response: ApiResponse<PaginatedResponse<RFQResponse>> = {
            success: true,
            data: result,
            requestId: getRequestId(req),
          };

          res.status(200).json(response);
        } else {
          const rfqs = await this.service.getAvailableRFQsByRole(
            targetRole as any,
            { type: type as string, status: status as string },
            requesterCompanyId
          );

          const response: ApiResponse = {
            success: true,
            data: rfqs,
            requestId: getRequestId(req),
          };

          res.status(200).json(response);
        }
      } else {
        // Fallback to old method
        const { targetCompanyType } = req.query;
        const requesterCompanyId = req.user?.companyId;
        const rfqs = await this.service.getAvailableRFQs(
          targetCompanyType as any,
          { type: type as string, status: status as string },
          requesterCompanyId
        );

        const response: ApiResponse = {
          success: true,
          data: rfqs,
          requestId: getRequestId(req),
        };

        res.status(200).json(response);
      }
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

  /**
   * Get bids comparison for an RFQ
   * GET /api/rfqs/:rfqId/bids/compare
   */
  compareBids = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { rfqId } = req.params;
      const comparisonData = await this.service.getBidsComparison(rfqId);

      const response: ApiResponse = {
        success: true,
        data: comparisonData,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Enable anonymity for an RFQ
   * POST /api/rfqs/:id/enable-anonymity
   */
  enableAnonymity = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const rfq = await this.service.enableAnonymity(id, req.user.companyId);

      // Log audit event
      const { createAuditLog } = require('../../middlewares/audit.middleware');
      const { AuditAction, AuditResource } = require('../audit/schema');
      await createAuditLog(
        req.user.userId,
        req.user.companyId,
        AuditAction.ENABLE_ANONYMITY,
        AuditResource.RFQ,
        {
          resourceId: id,
          before: { anonymousBuyer: false },
          after: { anonymousBuyer: true },
        }
      );

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
   * Reveal identity for an anonymous RFQ
   * POST /api/rfqs/:id/reveal-identity
   */
  revealIdentity = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const rfq = await this.service.revealIdentity(
        id,
        req.user.companyId,
        req.user.role
      );

      // Log audit event
      const { createAuditLog } = require('../../middlewares/audit.middleware');
      const { AuditAction, AuditResource } = require('../audit/schema');
      await createAuditLog(
        req.user.userId,
        req.user.companyId,
        AuditAction.REVEAL_IDENTITY,
        AuditResource.RFQ,
        {
          resourceId: id,
          before: { anonymousBuyer: true },
          after: { anonymousBuyer: false },
          revealedBy: req.user.userId,
          revealedAt: new Date().toISOString(),
        }
      );

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
}
