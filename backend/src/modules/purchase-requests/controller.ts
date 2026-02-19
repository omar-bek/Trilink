import { Request, Response, NextFunction } from 'express';
import { PurchaseRequestService } from './service';
import {
  CreatePurchaseRequestDto,
  UpdatePurchaseRequestDto,
  ApprovePurchaseRequestDto,
  PurchaseRequestResponse,
} from './types';
import { ApiResponse, PaginatedResponse } from '../../types/common';
import { getRequestId } from '../../utils/requestId';
import { Role } from '../../config/rbac';

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
      // Enforce company isolation: only admin can access PRs from other companies
      const isAdmin = req.user?.role === Role.ADMIN;
      const requesterCompanyId = isAdmin ? undefined : req.user?.companyId;
      const purchaseRequest = await this.service.getPurchaseRequestById(
        id,
        requesterCompanyId,
        isAdmin
      );

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
   * Supports pagination: ?page=1&limit=20&sortBy=createdAt&sortOrder=desc
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

      const { status, buyerId, page, limit, sortBy, sortOrder } = req.query;

      // SECURITY FIX: Get category filter from middleware (for supplier companies)
      const categoryIds = (req as any).categoryFilter?.categoryIds;

      if (page || limit) {
        const result = await this.service.getPurchaseRequestsByCompanyPaginated(
          req.user.companyId,
          { 
            status: status as string, 
            buyerId: buyerId as string,
            categoryIds: categoryIds // Apply category filter
          },
          { page: page as string, limit: limit as string, sortBy: sortBy as string, sortOrder: sortOrder as 'asc' | 'desc' }
        );

        const response: ApiResponse<PaginatedResponse<PurchaseRequestResponse>> = {
          success: true,
          data: result,
          requestId: getRequestId(req),
        };

        res.status(200).json(response);
      } else {
        const purchaseRequests = await this.service.getPurchaseRequestsByCompany(
          req.user.companyId,
          { 
            status: status as string, 
            buyerId: buyerId as string,
            categoryIds: categoryIds // Apply category filter
          }
        );

        const response: ApiResponse = {
          success: true,
          data: purchaseRequests,
          requestId: getRequestId(req),
        };

        res.status(200).json(response);
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update purchase request
   * PATCH /api/purchase-requests/:id
   * Only draft purchase requests can be updated
   */
  updatePurchaseRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      // Clean the data: convert empty strings to undefined for optional fields
      const cleanedData: UpdatePurchaseRequestDto = { ...req.body };

      // Convert empty strings to undefined for optional fields
      if (cleanedData.title === '') cleanedData.title = undefined;
      if (cleanedData.description === '') cleanedData.description = undefined;
      if (cleanedData.currency === '') cleanedData.currency = undefined;
      if (cleanedData.requiredDeliveryDate === '') cleanedData.requiredDeliveryDate = undefined;
      if (cleanedData.budget === null || cleanedData.budget === undefined) cleanedData.budget = undefined;

      // Handle deliveryLocation - clean coordinates and check if all fields are empty
      if (cleanedData.deliveryLocation) {
        const { address, city, state, country, zipCode, coordinates } = cleanedData.deliveryLocation;

        // Clean coordinates - remove if invalid or empty
        if (coordinates) {
          const lat = coordinates.lat;
          const lng = coordinates.lng;
          if (
            lat === undefined || lat === null || isNaN(Number(lat)) ||
            lng === undefined || lng === null || isNaN(Number(lng))
          ) {
            // Remove invalid coordinates
            delete cleanedData.deliveryLocation.coordinates;
          } else {
            // Ensure coordinates are numbers
            cleanedData.deliveryLocation.coordinates = {
              lat: Number(lat),
              lng: Number(lng),
            };
          }
        }

        // If all fields are empty, set to undefined
        if (!address && !city && !state && !country && !zipCode && !cleanedData.deliveryLocation.coordinates) {
          cleanedData.deliveryLocation = undefined;
        }
      }

      const data: UpdatePurchaseRequestDto = cleanedData;
      // Enforce company isolation
      const requesterCompanyId =
        req.user.role === Role.ADMIN ? undefined : req.user.companyId;
      // Only enforce buyer ownership for BUYER role, not COMPANY_MANAGER
      // COMPANY_MANAGER can update purchase requests from their company
      const requesterBuyerId =
        req.user.role === Role.ADMIN || req.user.role === Role.COMPANY_MANAGER
          ? undefined
          : req.user.userId;
      const purchaseRequest = await this.service.updatePurchaseRequest(
        id,
        data,
        requesterCompanyId,
        requesterBuyerId
      );

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
   * Submit purchase request
   * POST /api/purchase-requests/:id/submit
   * Transitions status from draft to submitted
   */
  submitPurchaseRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      // Enforce company isolation
      const requesterCompanyId =
        req.user.role === Role.ADMIN ? undefined : req.user.companyId;
      // Only enforce buyer ownership for BUYER role, not COMPANY_MANAGER
      // COMPANY_MANAGER can submit purchase requests from their company
      const requesterBuyerId =
        req.user.role === Role.ADMIN || req.user.role === Role.COMPANY_MANAGER
          ? undefined
          : req.user.userId;
      const purchaseRequest = await this.service.submitPurchaseRequest(
        id,
        requesterCompanyId,
        requesterBuyerId
      );

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
   * Workflow: SUBMITTED -> PENDING_APPROVAL -> APPROVED
   * Allowed roles: ADMIN, GOVERNMENT, COMPANY_MANAGER (for their own company)
   */
  approvePurchaseRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const data: ApprovePurchaseRequestDto = req.body;

      // For company managers, pass their companyId to enforce company isolation
      // Admin and Government can approve any purchase request (companyId is undefined)
      const requesterCompanyId =
        (req.user.role === Role.ADMIN || req.user.role === Role.GOVERNMENT)
          ? undefined
          : req.user.companyId;

      const purchaseRequest = await this.service.approvePurchaseRequest(
        id,
        req.user.userId,
        data,
        requesterCompanyId
      );

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
   * Only draft purchase requests can be deleted
   * COMPANY_MANAGER can delete purchase requests from their company
   */
  deletePurchaseRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      // Enforce company isolation
      const requesterCompanyId =
        req.user.role === Role.ADMIN ? undefined : req.user.companyId;
      // Only enforce buyer ownership for BUYER role, not COMPANY_MANAGER
      // COMPANY_MANAGER can delete purchase requests from their company
      const requesterBuyerId =
        req.user.role === Role.ADMIN || req.user.role === Role.COMPANY_MANAGER
          ? undefined
          : req.user.userId;
      await this.service.deletePurchaseRequest(id, requesterCompanyId, requesterBuyerId);

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
