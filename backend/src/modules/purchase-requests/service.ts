import { PurchaseRequestRepository } from './repository';
import {
  CreatePurchaseRequestDto,
  UpdatePurchaseRequestDto,
  PurchaseRequestResponse,
  ApprovePurchaseRequestDto,
} from './types';
import { AppError } from '../../middlewares/error.middleware';
import { IPurchaseRequest, PurchaseRequestStatus } from './schema';
import { RFQService } from '../rfqs/service';
import { logger } from '../../utils/logger';
import { UserRepository } from '../users/repository';
import { PaginatedResponse } from '../../types/common';
import { parsePaginationQuery, createPaginationResult, buildSortObject } from '../../utils/pagination';
import { CategoryRepository } from '../categories/repository';
import { CategoryRoutingService } from '../category-routing/service';
import { categoryEventEmitter, CategoryEvent, PRApprovedPayload } from '../category-routing/events';
import { CategoryRoutingQueueService } from '../category-routing/queue.service';
import mongoose from 'mongoose';

export class PurchaseRequestService {
  private repository: PurchaseRequestRepository;
  private rfqService: RFQService;
  private userRepository: UserRepository;
  private categoryRepository: CategoryRepository;
  private categoryRoutingService: CategoryRoutingService;
  private routingQueueService: CategoryRoutingQueueService;

  constructor() {
    this.repository = new PurchaseRequestRepository();
    this.rfqService = new RFQService();
    this.userRepository = new UserRepository();
    this.categoryRepository = new CategoryRepository();
    this.categoryRoutingService = new CategoryRoutingService();
    this.routingQueueService = new CategoryRoutingQueueService();
  }

  /**
   * Create a new purchase request
   * Validates category_id is provided and exists
   */
  async createPurchaseRequest(
    buyerId: string,
    companyId: string,
    data: CreatePurchaseRequestDto
  ): Promise<PurchaseRequestResponse> {
    // Validate category_id is provided (required)
    if (!data.categoryId) {
      throw new AppError('Category is required for purchase request', 400);
    }

    // Validate category exists and is active
    const category = await this.categoryRepository.findById(data.categoryId);
    if (!category) {
      throw new AppError('Category not found', 404);
    }
    if (!category.isActive) {
      throw new AppError('Category is not active', 400);
    }

    // Validate sub-category if provided
    if (data.subCategoryId) {
      const subCategory = await this.categoryRepository.findById(data.subCategoryId);
      if (!subCategory) {
        throw new AppError('Sub-category not found', 404);
      }
      if (!subCategory.isActive) {
        throw new AppError('Sub-category is not active', 400);
      }
      // Verify sub-category is actually a child of the main category
      if (subCategory.parentId?.toString() !== data.categoryId) {
        throw new AppError(
          'Sub-category does not belong to the specified main category',
          400
        );
      }
    }

    const purchaseRequest = await this.repository.create({
      buyerId: new mongoose.Types.ObjectId(buyerId),
      companyId: new mongoose.Types.ObjectId(companyId),
      categoryId: new mongoose.Types.ObjectId(data.categoryId),
      subCategoryId: data.subCategoryId ? new mongoose.Types.ObjectId(data.subCategoryId) : undefined,
      title: data.title,
      description: data.description,
      items: data.items,
      budget: data.budget,
      currency: data.currency,
      deliveryLocation: data.deliveryLocation,
      requiredDeliveryDate: new Date(data.requiredDeliveryDate),
      status: PurchaseRequestStatus.DRAFT,
    });

    return await this.toPurchaseRequestResponse(purchaseRequest);
  }

  /**
   * Get purchase request by ID
   * Enforces company isolation and category-based access control
   */
  async getPurchaseRequestById(
    id: string,
    requesterCompanyId?: string,
    isAdmin = false
  ): Promise<PurchaseRequestResponse> {
    const purchaseRequest = await this.repository.findById(id);
    if (!purchaseRequest) {
      throw new AppError('Purchase request not found', 404);
    }

    // Enforce company isolation (unless admin)
    if (requesterCompanyId && purchaseRequest.companyId.toString() !== requesterCompanyId) {
      // For non-buyer companies, check if they can view based on category specialization
      if (!isAdmin) {
        const canView = await this.categoryRoutingService.canCompanyViewPurchaseRequest(
          requesterCompanyId,
          purchaseRequest.categoryId.toString(),
          purchaseRequest.subCategoryId?.toString()
        );

        if (!canView) {
          throw new AppError(
            'Access denied: Your company does not specialize in this category',
            403
          );
        }
      }
    }

    return await this.toPurchaseRequestResponse(purchaseRequest);
  }

  /**
   * Get purchase requests by company
   * SECURITY FIX: Filters by company's categories for supplier companies
   */
  async getPurchaseRequestsByCompany(
    companyId: string,
    filters?: { status?: string; buyerId?: string; categoryIds?: string[] }
  ): Promise<PurchaseRequestResponse[]> {
    // If categoryIds provided, filter by them (for supplier companies)
    const purchaseRequests = await this.repository.findByCompanyId(
      companyId,
      filters as any
    );
    return Promise.all(
      purchaseRequests.map((pr) => this.toPurchaseRequestResponse(pr))
    );
  }

  /**
   * Get purchase requests by company with pagination
   * SECURITY FIX: Filters by company's categories for supplier companies
   */
  async getPurchaseRequestsByCompanyPaginated(
    companyId: string,
    filters?: { status?: string; buyerId?: string; categoryIds?: string[] },
    paginationQuery?: { page?: string; limit?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<PaginatedResponse<PurchaseRequestResponse>> {
    const pagination = parsePaginationQuery(paginationQuery || {});
    const sort = buildSortObject(pagination.sortBy || 'createdAt', pagination.sortOrder);

    const { purchaseRequests, total } = await this.repository.findByCompanyIdPaginated(
      companyId,
      filters as any,
      {
        skip: pagination.skip,
        limit: pagination.limit,
        sortBy: Object.keys(sort)[0],
        sortOrder: Object.values(sort)[0] === 1 ? 'asc' : 'desc',
      }
    );

    const responses = await Promise.all(
      purchaseRequests.map((pr) => this.toPurchaseRequestResponse(pr))
    );
    return createPaginationResult(responses, total, pagination);
  }

  /**
   * Update purchase request
   * Only draft purchase requests can be updated
   */
  async updatePurchaseRequest(
    id: string,
    data: UpdatePurchaseRequestDto,
    requesterCompanyId?: string,
    requesterBuyerId?: string
  ): Promise<PurchaseRequestResponse> {
    const purchaseRequest = await this.repository.findById(id);
    if (!purchaseRequest) {
      throw new AppError('Purchase request not found', 404);
    }

    // Enforce company isolation
    if (requesterCompanyId && purchaseRequest.companyId.toString() !== requesterCompanyId) {
      throw new AppError('Access denied: Purchase request belongs to different company', 403);
    }

    // Enforce buyer ownership
    if (requesterBuyerId && purchaseRequest.buyerId.toString() !== requesterBuyerId) {
      throw new AppError('Access denied: Only the buyer who created this request can update it', 403);
    }

    // Lifecycle validation: Only draft purchase requests can be updated
    if (purchaseRequest.status !== PurchaseRequestStatus.DRAFT) {
      throw new AppError(
        `Cannot update purchase request. Current status: ${purchaseRequest.status}. Only draft requests can be updated.`,
        400
      );
    }

    // Prevent status changes through update endpoint (use submit endpoint instead)
    if (data.status && data.status !== PurchaseRequestStatus.DRAFT) {
      throw new AppError('Cannot change status through update. Use submit endpoint to submit the request.', 400);
    }

    // Validate category if being updated
    if (data.categoryId !== undefined) {
      const category = await this.categoryRepository.findById(data.categoryId);
      if (!category) {
        throw new AppError('Category not found', 404);
      }
      if (!category.isActive) {
        throw new AppError('Category is not active', 400);
      }
    }

    // Validate sub-category if being updated
    if (data.subCategoryId !== undefined && data.subCategoryId !== null) {
      const subCategory = await this.categoryRepository.findById(data.subCategoryId);
      if (!subCategory) {
        throw new AppError('Sub-category not found', 404);
      }
      if (!subCategory.isActive) {
        throw new AppError('Sub-category is not active', 400);
      }

      // Verify sub-category belongs to the main category (use updated categoryId if provided, otherwise existing)
      const mainCategoryId = data.categoryId || purchaseRequest.categoryId.toString();
      if (subCategory.parentId?.toString() !== mainCategoryId) {
        throw new AppError(
          'Sub-category does not belong to the specified main category',
          400
        );
      }
    }

    // Validate items if provided
    if (data.items !== undefined) {
      if (!Array.isArray(data.items) || data.items.length === 0) {
        throw new AppError('Purchase request must have at least one item', 400);
      }
      // Validate each item
      for (const item of data.items) {
        if (!item.name || item.name.trim().length === 0) {
          throw new AppError('All items must have a name', 400);
        }
        if (!item.quantity || item.quantity < 1) {
          throw new AppError('All items must have a quantity of at least 1', 400);
        }
        if (!item.unit || item.unit.trim().length === 0) {
          throw new AppError('All items must have a unit', 400);
        }
        if (!item.specifications || item.specifications.trim().length === 0) {
          throw new AppError('All items must have specifications', 400);
        }
      }
    }

    // Validate budget if provided
    if (data.budget !== undefined) {
      const budgetValue = typeof data.budget === 'string' ? parseFloat(data.budget) : data.budget;
      if (isNaN(budgetValue) || budgetValue < 0) {
        throw new AppError('Budget must be a valid number greater than or equal to 0', 400);
      }
    }

    // Validate delivery location if provided
    if (data.deliveryLocation !== undefined && data.deliveryLocation !== null) {
      const { address, city, state, country, zipCode } = data.deliveryLocation;
      if (address !== undefined && (!address || address.trim().length === 0)) {
        throw new AppError('Delivery address cannot be empty', 400);
      }
      if (city !== undefined && (!city || city.trim().length === 0)) {
        throw new AppError('Delivery city cannot be empty', 400);
      }
      if (state !== undefined && (!state || state.trim().length === 0)) {
        throw new AppError('Delivery state cannot be empty', 400);
      }
      if (country !== undefined && (!country || country.trim().length === 0)) {
        throw new AppError('Delivery country cannot be empty', 400);
      }
      if (zipCode !== undefined && (!zipCode || zipCode.trim().length === 0)) {
        throw new AppError('Delivery zip code cannot be empty', 400);
      }
    }

    const updateData: Partial<IPurchaseRequest> = {};
    
    // Copy non-category fields
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.items !== undefined) updateData.items = data.items;
    if (data.budget !== undefined) updateData.budget = data.budget;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.requiredDeliveryDate !== undefined) updateData.requiredDeliveryDate = new Date(data.requiredDeliveryDate);
    if (data.status !== undefined) updateData.status = data.status;
    
    // Handle deliveryLocation - only update if all required fields are provided
    if (data.deliveryLocation !== undefined) {
      const loc = data.deliveryLocation;
      if (loc.address && loc.city && loc.state && loc.country && loc.zipCode) {
        updateData.deliveryLocation = {
          address: loc.address,
          city: loc.city,
          state: loc.state,
          country: loc.country,
          zipCode: loc.zipCode,
          coordinates: loc.coordinates,
        };
      }
    }
    
    // Handle category updates
    if (data.categoryId !== undefined) {
      updateData.categoryId = new mongoose.Types.ObjectId(data.categoryId);
    }
    if (data.subCategoryId !== undefined) {
      updateData.subCategoryId = data.subCategoryId ? new mongoose.Types.ObjectId(data.subCategoryId) : undefined;
    }
    
    // Ensure budget is a number if provided
    if (data.budget !== undefined) {
      updateData.budget = typeof data.budget === 'string' ? parseFloat(data.budget) : data.budget;
    }
    if (data.requiredDeliveryDate) {
      updateData.requiredDeliveryDate = new Date(data.requiredDeliveryDate);
    }
    // Ensure status remains draft
    updateData.status = PurchaseRequestStatus.DRAFT;

    const updated = await this.repository.update(id, updateData);
    if (!updated) {
      throw new AppError('Failed to update purchase request', 500);
    }

    return await this.toPurchaseRequestResponse(updated);
  }

  /**
   * Submit purchase request
   * Transitions status from draft to submitted
   * Only draft purchase requests can be submitted
   */
  async submitPurchaseRequest(
    id: string,
    requesterCompanyId?: string,
    requesterBuyerId?: string
  ): Promise<PurchaseRequestResponse> {
    const purchaseRequest = await this.repository.findById(id);
    if (!purchaseRequest) {
      throw new AppError('Purchase request not found', 404);
    }

    // Enforce company isolation
    if (requesterCompanyId && purchaseRequest.companyId.toString() !== requesterCompanyId) {
      throw new AppError('Access denied: Purchase request belongs to different company', 403);
    }

    // Enforce buyer ownership
    if (requesterBuyerId && purchaseRequest.buyerId.toString() !== requesterBuyerId) {
      throw new AppError('Access denied: Only the buyer who created this request can submit it', 403);
    }

    // Lifecycle validation: Only draft purchase requests can be submitted
    if (purchaseRequest.status !== PurchaseRequestStatus.DRAFT) {
      throw new AppError(
        `Cannot submit purchase request. Current status: ${purchaseRequest.status}. Only draft requests can be submitted.`,
        400
      );
    }

    // Validate required fields before submission
    if (!purchaseRequest.items || purchaseRequest.items.length === 0) {
      throw new AppError('Cannot submit purchase request without items', 400);
    }

    if (!purchaseRequest.budget || purchaseRequest.budget <= 0) {
      throw new AppError('Cannot submit purchase request without valid budget', 400);
    }

    if (!purchaseRequest.requiredDeliveryDate) {
      throw new AppError('Cannot submit purchase request without required delivery date', 400);
    }

    if (!purchaseRequest.deliveryLocation) {
      throw new AppError('Cannot submit purchase request without delivery location', 400);
    }

    // Validate delivery location fields
    const { address, city, state, country, zipCode } = purchaseRequest.deliveryLocation;
    if (!address || !city || !state || !country || !zipCode) {
      throw new AppError(
        'Cannot submit purchase request: Delivery location is incomplete. All fields (address, city, state, country, zipCode) are required.',
        400
      );
    }

    // Validate title and description
    if (!purchaseRequest.title || purchaseRequest.title.trim().length === 0) {
      throw new AppError('Cannot submit purchase request without title', 400);
    }

    if (!purchaseRequest.description || purchaseRequest.description.trim().length === 0) {
      throw new AppError('Cannot submit purchase request without description', 400);
    }

    // Update status to submitted and add history entry
    const historyEntry = {
      status: PurchaseRequestStatus.SUBMITTED,
      timestamp: new Date(),
    };

    // First update status to SUBMITTED
    const updated = await this.repository.update(id, {
      status: PurchaseRequestStatus.SUBMITTED,
    });

    if (!updated) {
      throw new AppError('Failed to submit purchase request', 500);
    }

    // Then add history entry using MongoDB update operator
    await this.repository.addApprovalHistory(id, historyEntry);

    // Automatically transition to PENDING_APPROVAL after submission
    const pendingApprovalEntry = {
      status: PurchaseRequestStatus.PENDING_APPROVAL,
      timestamp: new Date(),
    };

    const finalUpdated = await this.repository.update(id, {
      status: PurchaseRequestStatus.PENDING_APPROVAL,
    });
    await this.repository.addApprovalHistory(id, pendingApprovalEntry);

    if (!finalUpdated) {
      throw new AppError('Failed to transition purchase request to pending approval', 500);
    }

    return await this.toPurchaseRequestResponse(finalUpdated);
  }

  /**
   * Approve purchase request and generate RFQs
   * Workflow: SUBMITTED -> PENDING_APPROVAL -> APPROVED
   * Transitions from PENDING_APPROVAL to APPROVED
   * @param requesterCompanyId - Company ID of the approver (for company managers, must match purchase request company)
   */
  async approvePurchaseRequest(
    id: string,
    approverId: string,
    data?: ApprovePurchaseRequestDto,
    requesterCompanyId?: string
  ): Promise<PurchaseRequestResponse> {
    const purchaseRequest = await this.repository.findById(id);
    if (!purchaseRequest) {
      throw new AppError('Purchase request not found', 404);
    }

    // Validate status transition: Only PENDING_APPROVAL can be approved
    if (purchaseRequest.status !== PurchaseRequestStatus.PENDING_APPROVAL) {
      throw new AppError(
        `Cannot approve purchase request. Current status: ${purchaseRequest.status}. Only pending_approval requests can be approved.`,
        400
      );
    }

    // For company managers, ensure they can only approve purchase requests from their own company
    if (requesterCompanyId) {
      const purchaseRequestCompanyId = purchaseRequest.companyId.toString();
      if (purchaseRequestCompanyId !== requesterCompanyId) {
        throw new AppError(
          'You can only approve purchase requests from your own company',
          403
        );
      }
    }

    // Fetch approver information
    const approver = await this.userRepository.findById(approverId);
    const approverName = approver
      ? `${approver.firstName} ${approver.lastName}`.trim()
      : undefined;

    // Create approval history entry
    const approvalHistoryEntry = {
      status: PurchaseRequestStatus.APPROVED,
      approverId: approverId,
      approverName: approverName,
      notes: data?.notes,
      timestamp: new Date(),
    };

    // Update status to approved and set approverId
    const updated = await this.repository.update(id, {
      status: PurchaseRequestStatus.APPROVED,
      approverId: new mongoose.Types.ObjectId(approverId),
    });

    if (!updated) {
      throw new AppError('Failed to approve purchase request', 500);
    }

    // Add history entry using MongoDB update operator
    await this.repository.addApprovalHistory(id, approvalHistoryEntry);

    // Event-driven PR routing: Queue async routing and snapshot
    try {
      // Get matching companies for routing snapshot
      const matchedCompanies = await this.categoryRoutingService.findMatchingCompanies(
        purchaseRequest.categoryId.toString(),
        purchaseRequest.subCategoryId?.toString()
      );

      const matchedCompanyIds = matchedCompanies.map(m => m.companyId);

      // Queue async routing processing (non-blocking)
      await this.routingQueueService.queuePRRouting(id);

      // Emit PR approved event
      const payload: PRApprovedPayload = {
        prId: id,
        categoryId: purchaseRequest.categoryId.toString(),
        subCategoryId: purchaseRequest.subCategoryId?.toString(),
        matchedCompanyIds
      };
      categoryEventEmitter.emit(CategoryEvent.PR_APPROVED, payload);

      logger.info(
        `PR ${id} approved, ${matchedCompanyIds.length} companies matched, routing queued`
      );
    } catch (error) {
      // Log error but don't fail the approval
      logger.error(
        `Failed to queue PR routing for approved Purchase Request ${id}:`,
        error
      );
    }

    // Event-driven RFQ generation: Auto-create RFQs when PR becomes "approved"
    try {
      const anonymousBuyer = false; // Can be made configurable per PR
      // Convert rfqTypes from string array to RFQType enum if provided
      const rfqTypes = data?.rfqTypes 
        ? (data.rfqTypes as any[]) // Will be validated in RFQ service
        : undefined;
      const generatedRFQs = await this.rfqService.generateRFQsForPurchaseRequest(
        id,
        anonymousBuyer,
        rfqTypes
      );
      logger.info(
        `Auto-generated ${generatedRFQs.length} RFQs for approved Purchase Request ${id}`
      );
    } catch (error) {
      // Log error but don't fail the approval
      logger.error(
        `Failed to auto-generate RFQs for approved Purchase Request ${id}:`,
        error
      );
    }

    return await this.toPurchaseRequestResponse(updated);
  }

  /**
   * Delete purchase request (soft delete)
   * Only draft purchase requests can be deleted
   */
  async deletePurchaseRequest(
    id: string,
    requesterCompanyId?: string,
    requesterBuyerId?: string
  ): Promise<void> {
    const purchaseRequest = await this.repository.findById(id);
    if (!purchaseRequest) {
      throw new AppError('Purchase request not found', 404);
    }

    // Enforce company isolation
    if (requesterCompanyId && purchaseRequest.companyId.toString() !== requesterCompanyId) {
      throw new AppError('Access denied: Purchase request belongs to different company', 403);
    }

    // Enforce buyer ownership
    if (requesterBuyerId && purchaseRequest.buyerId.toString() !== requesterBuyerId) {
      throw new AppError('Access denied: Only the buyer who created this request can delete it', 403);
    }

    // Lifecycle validation: Only draft purchase requests can be deleted
    if (purchaseRequest.status !== PurchaseRequestStatus.DRAFT) {
      throw new AppError('Only draft purchase requests can be deleted', 400);
    }

    await this.repository.softDelete(id);
  }

  /**
   * Convert IPurchaseRequest to PurchaseRequestResponse
   */
  private async toPurchaseRequestResponse(
    pr: IPurchaseRequest
  ): Promise<PurchaseRequestResponse> {
    // Fetch category names if available
    let categoryName: string | undefined;
    let subCategoryName: string | undefined;

    try {
      if (pr.categoryId) {
        const category = await this.categoryRepository.findById(pr.categoryId.toString());
        categoryName = category?.name;
      }
      if (pr.subCategoryId) {
        const subCategory = await this.categoryRepository.findById(pr.subCategoryId.toString());
        subCategoryName = subCategory?.name;
      }
    } catch (error) {
      // If category lookup fails, continue without names
      logger.warn(`Failed to fetch category names for PR ${pr._id}:`, error);
    }

    return {
      id: pr._id.toString(),
      buyerId: pr.buyerId.toString(),
      companyId: pr.companyId.toString(),
      categoryId: pr.categoryId.toString(),
      subCategoryId: pr.subCategoryId?.toString(),
      categoryName,
      subCategoryName,
      title: pr.title,
      description: pr.description,
      items: pr.items,
      budget: pr.budget,
      currency: pr.currency,
      deliveryLocation: pr.deliveryLocation,
      requiredDeliveryDate: pr.requiredDeliveryDate,
      status: pr.status,
      approverId: pr.approverId?.toString(),
      approvalHistory: (pr.approvalHistory || []).map(h => ({
        ...h,
        approverId: h.approverId?.toString(),
      })),
      rfqGenerated: pr.rfqGenerated,
      createdAt: pr.createdAt,
      updatedAt: pr.updatedAt,
    };
  }
}
