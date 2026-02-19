import { Request, Response, NextFunction } from 'express';
import { BidService } from './service';
import { CreateBidDto, UpdateBidDto, EvaluateBidDto, BidResponse } from './types';
import { ApiResponse, PaginatedResponse } from '../../types/common';
import { getRequestId } from '../../utils/requestId';
import { Role } from '../../config/rbac';

export class BidController {
  private service: BidService;

  constructor() {
    this.service = new BidService();
  }

  /**
   * Create a new bid
   * POST /api/bids
   */
  createBid = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data: CreateBidDto = req.body;
      const bid = await this.service.createBid(
        req.user.userId,
        req.user.companyId,
        data
      );

      const response: ApiResponse = {
        success: true,
        data: bid,
        requestId: getRequestId(req),
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get bid by ID
   * GET /api/bids/:id
   * Buyer can view all bids, Providers can only view their own
   */
  getBidById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const requesterRole = req.user.role as Role;
      const requesterCompanyId = req.user.companyId;
      const bid = await this.service.getBidById(id, requesterRole, requesterCompanyId);

      const response: ApiResponse = {
        success: true,
        data: bid,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get bids by RFQ
   * GET /api/bids/rfq/:rfqId
   * Buyer can view all bids, Providers can only view their own
   */
  getBidsByRFQ = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { rfqId } = req.params;
      const { status } = req.query;
      const requesterRole = req.user.role as Role;
      const requesterCompanyId = req.user.companyId;
      
      const bids = await this.service.getBidsByRFQ(
        rfqId,
        { status: status as string },
        requesterRole,
        requesterCompanyId
      );

      const response: ApiResponse = {
        success: true,
        data: bids,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get bids
   * GET /api/bids
   * Supports pagination: ?page=1&limit=20&sortBy=createdAt&sortOrder=desc
   */
  getBids = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      if (!req.user.companyId) {
        throw new Error('User company ID is required');
      }

      const { status, rfqId, page, limit, sortBy, sortOrder } = req.query;
      const requesterRole = req.user.role as Role;
      
      if (page || limit) {
        const result = await this.service.getBidsByCompanyPaginated(
          req.user.companyId,
          { status: status as string, rfqId: rfqId as string },
          { page: page as string, limit: limit as string, sortBy: sortBy as string, sortOrder: sortOrder as 'asc' | 'desc' },
          requesterRole
        );

        const response: ApiResponse<PaginatedResponse<BidResponse>> = {
          success: true,
          data: result,
          requestId: getRequestId(req),
        };

        res.status(200).json(response);
      } else {
        const bids = await this.service.getBidsByCompany(
          req.user.companyId,
          { status: status as string, rfqId: rfqId as string },
          requesterRole
        );

        const response: ApiResponse = {
          success: true,
          data: bids,
          requestId: getRequestId(req),
        };

        res.status(200).json(response);
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update bid
   * PATCH /api/bids/:id
   * Only draft or submitted bids can be updated
   */
  updateBid = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const data: UpdateBidDto = req.body;
      const requesterCompanyId = 
        req.user.role === Role.ADMIN ? undefined : req.user.companyId;
      const bid = await this.service.updateBid(id, data, requesterCompanyId);

      const response: ApiResponse = {
        success: true,
        data: bid,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Withdraw bid
   * POST /api/bids/:id/withdraw
   * Only submitted bids can be withdrawn
   */
  withdrawBid = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const requesterCompanyId = 
        req.user.role === Role.ADMIN ? undefined : req.user.companyId;
      const bid = await this.service.withdrawBid(id, requesterCompanyId);

      const response: ApiResponse = {
        success: true,
        data: bid,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Evaluate bid
   * POST /api/bids/:id/evaluate
   */
  evaluateBid = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const data: EvaluateBidDto = req.body;
      const requesterCompanyId = 
        req.user.role === Role.ADMIN ? undefined : req.user.companyId;
      const bid = await this.service.evaluateBid(id, data, requesterCompanyId);

      const response: ApiResponse = {
        success: true,
        data: bid,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete bid
   * DELETE /api/bids/:id
   */
  deleteBid = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.deleteBid(id);

      const response: ApiResponse = {
        success: true,
        data: { message: 'Bid deleted successfully' },
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Enable anonymity for a bid
   * POST /api/bids/:id/enable-anonymity
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
      const bid = await this.service.enableAnonymity(id, req.user.companyId);

      // Log audit event
      const { createAuditLog } = require('../../middlewares/audit.middleware');
      const { AuditAction, AuditResource } = require('../audit/schema');
      await createAuditLog(
        req.user.userId,
        req.user.companyId,
        AuditAction.ENABLE_ANONYMITY,
        AuditResource.BID,
        {
          resourceId: id,
          before: { anonymousBidder: false },
          after: { anonymousBidder: true },
        }
      );

      const response: ApiResponse = {
        success: true,
        data: bid,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reveal identity for an anonymous bid
   * POST /api/bids/:id/reveal-identity
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
      const requesterRole = req.user.role as Role;
      const bid = await this.service.revealIdentity(
        id,
        req.user.companyId,
        requesterRole
      );

      // Log audit event
      const { createAuditLog } = require('../../middlewares/audit.middleware');
      const { AuditAction, AuditResource } = require('../audit/schema');
      await createAuditLog(
        req.user.userId,
        req.user.companyId,
        AuditAction.REVEAL_IDENTITY,
        AuditResource.BID,
        {
          resourceId: id,
          before: { anonymousBidder: true },
          after: { anonymousBidder: false },
          revealedBy: req.user.userId,
          revealedAt: new Date().toISOString(),
        }
      );

      const response: ApiResponse = {
        success: true,
        data: bid,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
