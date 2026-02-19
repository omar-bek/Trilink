import { Request, Response, NextFunction } from 'express';
import { BidService } from './service';
import { CreateBidDto, UpdateBidDto, EvaluateBidDto } from './types';
import { ApiResponse } from '../../types/common';
import { getRequestId } from '../../utils/requestId';

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
   */
  getBidById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const bid = await this.service.getBidById(id);

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
   */
  getBidsByRFQ = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { rfqId } = req.params;
      const { status } = req.query;
      const bids = await this.service.getBidsByRFQ(rfqId, {
        status: status as string,
      });

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

      const { status, rfqId } = req.query;
      const bids = await this.service.getBidsByCompany(
        req.user.companyId,
        { status: status as string, rfqId: rfqId as string }
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
   * Update bid
   * PATCH /api/bids/:id
   */
  updateBid = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const data: UpdateBidDto = req.body;
      const bid = await this.service.updateBid(id, data);

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
      const { id } = req.params;
      const data: EvaluateBidDto = req.body;
      const bid = await this.service.evaluateBid(id, data);

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
}
