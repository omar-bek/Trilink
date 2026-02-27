import { RFQRepository } from './repository';
import { CreateRFQDto, UpdateRFQDto, RFQResponse } from './types';
import { AppError } from '../../middlewares/error.middleware';
import { IRFQ, RFQType, RFQStatus } from './schema';
import { PurchaseRequestRepository } from '../purchase-requests/repository';
import { CompanyType } from '../companies/schema';
import { Role } from '../../config/rbac';
import { PurchaseRequestStatus } from '../purchase-requests/schema';
import { BidRepository } from '../bids/repository';
import { CompanyRepository } from '../companies/repository';
import { PaginatedResponse } from '../../types/common';
import { parsePaginationQuery, createPaginationResult, buildSortObject } from '../../utils/pagination';
import { notificationService, NotificationEvent } from '../notifications';
import { notificationHelpers } from '../notifications/helpers';
import { EmailRecipient } from '../notifications/types';
import { logger } from '../../utils/logger';
import mongoose from 'mongoose';

export class RFQService {
  private repository: RFQRepository;
  private purchaseRequestRepository: PurchaseRequestRepository;
  private bidRepository: BidRepository;
  private companyRepository: CompanyRepository;

  constructor() {
    this.repository = new RFQRepository();
    this.purchaseRequestRepository = new PurchaseRequestRepository();
    this.bidRepository = new BidRepository();
    this.companyRepository = new CompanyRepository();
  }

  /**
   * Create a new RFQ
   */
  async createRFQ(
    companyId: string,
    data: CreateRFQDto
  ): Promise<RFQResponse> {
    // Verify purchase request exists
    const purchaseRequest = await this.purchaseRequestRepository.findById(
      data.purchaseRequestId
    );
    if (!purchaseRequest) {
      throw new AppError('Purchase request not found', 404);
    }

    // Validate target company IDs if provided
    let targetCompanyIds: mongoose.Types.ObjectId[] | undefined;
    if (data.targetCompanyIds && data.targetCompanyIds.length > 0) {
      // Verify all companies exist and match the target company type
      const companies = await this.companyRepository.findByIds(data.targetCompanyIds);
      if (companies.length !== data.targetCompanyIds.length) {
        throw new AppError('One or more target companies not found', 400);
      }
      
      // Verify companies match the target company type
      const invalidCompanies = companies.filter(
        (company) => company.type !== data.targetCompanyType
      );
      if (invalidCompanies.length > 0) {
        throw new AppError(
          `Some target companies do not match the required company type: ${data.targetCompanyType}`,
          400
        );
      }

      targetCompanyIds = data.targetCompanyIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      );
    }

    const rfq = await this.repository.create({
      ...data,
      purchaseRequestId: new mongoose.Types.ObjectId(data.purchaseRequestId),
      companyId: new mongoose.Types.ObjectId(companyId),
      targetCompanyIds,
      requiredDeliveryDate: new Date(data.requiredDeliveryDate),
      deadline: new Date(data.deadline),
      anonymousBuyer: data.anonymousBuyer ?? false,
    });

    // Send notification to specific companies or target role users about new RFQ
    try {
      let recipients: EmailRecipient[] = [];
      
      if (targetCompanyIds && targetCompanyIds.length > 0) {
        // Send to specific companies
        for (const companyId of targetCompanyIds) {
          const companyRecipients = await notificationHelpers.getRecipientsByCompany(
            companyId.toString()
          );
          recipients.push(...companyRecipients.map(r => ({
            email: r.email,
            name: r.name || r.email,
          })));
        }
      } else {
        // Fall back to role-based notification
        const roleRecipients = await notificationHelpers.getRecipientsByRole(rfq.targetRole);
        recipients = roleRecipients.map(r => ({
          email: r.email,
          name: r.name || r.email,
        }));
      }

      if (recipients.length > 0) {
        await notificationService.notify({
          event: NotificationEvent.RFQ_CREATED,
          recipients,
          data: {
            recipientName: recipients[0]?.name || 'User',
            rfqId: rfq._id.toString(),
            rfqNumber: rfq.rfqNumber || rfq._id.toString(),
            title: rfq.title,
            deadline: rfq.deadline.toLocaleString(),
            budget: `${rfq.currency} ${rfq.budget.toLocaleString()}`,
            rfqUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/rfqs/${rfq._id}`,
          },
        });
      }
    } catch (error) {
      logger.error('Failed to send RFQ created notification:', error);
      // Don't fail the request if notification fails
    }

    // Notify company managers about RFQ creation
    try {
      await notificationService.notifyCompanyManagers(
        companyId,
        NotificationEvent.RFQ_CREATED,
        {
          title: `New RFQ Created: ${rfq.title}`,
          message: `A new RFQ has been created: "${rfq.title}". Budget: ${rfq.currency} ${rfq.budget.toLocaleString()}, Deadline: ${rfq.deadline.toLocaleDateString()}`,
          entityType: 'rfq',
          entityId: rfq._id.toString(),
          actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/rfqs/${rfq._id}`,
          rfqId: rfq._id.toString(),
          rfqNumber: rfq.rfqNumber || rfq._id.toString(),
          rfqTitle: rfq.title,
          deadline: rfq.deadline.toLocaleString(),
          budget: `${rfq.currency} ${rfq.budget.toLocaleString()}`,
        }
      );
    } catch (error) {
      logger.error('Failed to notify company managers about RFQ creation:', error);
    }

    return this.toRFQResponse(rfq, companyId);
  }

  /**
   * Auto-generate RFQs for a purchase request
   * Creates RFQs for Supplier, Logistics, Clearance, and Service Provider
   * This is called automatically when a PR status becomes "approved"
   * @param rfqTypes Optional array of RFQ types to generate. If not provided, all types will be generated.
   */
  async generateRFQsForPurchaseRequest(
    purchaseRequestId: string,
    anonymousBuyer: boolean = false,
    rfqTypes?: RFQType[]
  ): Promise<RFQResponse[]> {
    const purchaseRequest = await this.purchaseRequestRepository.findById(
      purchaseRequestId
    );
    if (!purchaseRequest) {
      throw new AppError('Purchase request not found', 404);
    }

    // Only generate RFQs for submitted or approved purchase requests
    if (purchaseRequest.status !== PurchaseRequestStatus.SUBMITTED && 
        purchaseRequest.status !== PurchaseRequestStatus.APPROVED) {
      throw new AppError(
        `Cannot generate RFQs for purchase request with status: ${purchaseRequest.status}. Only submitted or approved PRs can generate RFQs.`,
        400
      );
    }

    // Check if RFQs already exist for this purchase request
    const existingRFQs = await this.repository.findByPurchaseRequestId(purchaseRequestId);
    if (existingRFQs.length > 0) {
      // RFQs already generated, return existing ones
      return existingRFQs.map((rfq) => this.toRFQResponse(rfq, purchaseRequest.companyId.toString()));
    }

    const rfqs: RFQResponse[] = [];
    const allRfqConfigs = [
      { 
        type: RFQType.SUPPLIER, 
        targetRole: Role.SUPPLIER,
        targetCompanyType: CompanyType.SUPPLIER 
      },
      { 
        type: RFQType.LOGISTICS, 
        targetRole: Role.LOGISTICS,
        targetCompanyType: CompanyType.LOGISTICS 
      },
      { 
        type: RFQType.CLEARANCE, 
        targetRole: Role.CLEARANCE,
        targetCompanyType: CompanyType.CLEARANCE 
      },
      { 
        type: RFQType.SERVICE_PROVIDER, 
        targetRole: Role.SERVICE_PROVIDER,
        targetCompanyType: CompanyType.SERVICE_PROVIDER 
      },
    ];

    // Filter RFQ configs based on requested types
    const rfqConfigs = rfqTypes && rfqTypes.length > 0
      ? allRfqConfigs.filter(config => rfqTypes.includes(config.type))
      : allRfqConfigs;

    // Calculate deadline (7 days from now, or use a configurable default)
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    for (const { type, targetRole, targetCompanyType } of rfqConfigs) {
      const rfq = await this.repository.create({
        purchaseRequestId: purchaseRequest._id,
        companyId: purchaseRequest.companyId,
        type,
        targetRole,
        targetCompanyType,
        title: `${purchaseRequest.title} - ${type} RFQ`,
        description: purchaseRequest.description,
        items: purchaseRequest.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          specifications: item.specifications,
        })),
        budget: purchaseRequest.budget,
        currency: purchaseRequest.currency,
        deliveryLocation: purchaseRequest.deliveryLocation,
        requiredDeliveryDate: purchaseRequest.requiredDeliveryDate,
        deadline,
        status: RFQStatus.OPEN,
        anonymousBuyer,
      });

      rfqs.push(this.toRFQResponse(rfq, purchaseRequest.companyId.toString()));
    }

    return rfqs;
  }

  /**
   * Get RFQ by ID
   */
  async getRFQById(id: string, requesterCompanyId?: string): Promise<RFQResponse> {
    const rfq = await this.repository.findById(id);
    if (!rfq) {
      throw new AppError('RFQ not found', 404);
    }
    return this.toRFQResponse(rfq, requesterCompanyId);
  }

  /**
   * Get RFQs by purchase request
   */
  async getRFQsByPurchaseRequest(
    purchaseRequestId: string,
    requesterCompanyId?: string
  ): Promise<RFQResponse[]> {
    const rfqs = await this.repository.findByPurchaseRequestId(
      purchaseRequestId
    );
    return rfqs.map((rfq) => this.toRFQResponse(rfq, requesterCompanyId));
  }

  /**
   * Get RFQs by company
   */
  async getRFQsByCompany(
    companyId: string,
    filters?: { type?: string; status?: string }
  ): Promise<RFQResponse[]> {
    const rfqs = await this.repository.findByCompanyId(companyId, filters as any);
    return rfqs.map((rfq) => this.toRFQResponse(rfq));
  }

  /**
   * Get RFQs by company with pagination
   */
  async getRFQsByCompanyPaginated(
    companyId: string,
    filters?: { type?: string; status?: string },
    paginationQuery?: { page?: string; limit?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<PaginatedResponse<RFQResponse>> {
    const pagination = parsePaginationQuery(paginationQuery || {});
    const sort = buildSortObject(pagination.sortBy || 'createdAt', pagination.sortOrder);

    const { rfqs, total } = await this.repository.findByCompanyIdPaginated(
      companyId,
      filters as any,
      {
        skip: pagination.skip,
        limit: pagination.limit,
        sortBy: Object.keys(sort)[0],
        sortOrder: Object.values(sort)[0] === 1 ? 'asc' : 'desc',
      }
    );

    return createPaginationResult(
      rfqs.map((rfq) => this.toRFQResponse(rfq)),
      total,
      pagination
    );
  }

  /**
   * Get available RFQs for a company type (for providers)
   * Note: Providers should not see companyId for anonymous RFQs
   */
  async getAvailableRFQs(
    targetCompanyType: CompanyType,
    filters?: { status?: string; type?: string },
    requesterCompanyId?: string
  ): Promise<RFQResponse[]> {
    const rfqs = await this.repository.findByTargetCompanyType(
      targetCompanyType,
      filters as any,
      requesterCompanyId
    );
    // Providers are not owners, so anonymous RFQs will have companyId hidden
    return rfqs.map((rfq) => this.toRFQResponse(rfq, requesterCompanyId));
  }

  /**
   * Get available RFQs for a target role (for providers)
   * Note: Providers should not see companyId for anonymous RFQs
   */
  async getAvailableRFQsByRole(
    targetRole: Role,
    filters?: { status?: string; type?: string },
    requesterCompanyId?: string
  ): Promise<RFQResponse[]> {
    const rfqs = await this.repository.findByTargetRole(
      targetRole,
      filters as any,
      requesterCompanyId
    );
    // Providers are not owners, so anonymous RFQs will have companyId hidden
    return rfqs.map((rfq) => this.toRFQResponse(rfq, requesterCompanyId));
  }

  /**
   * Get available RFQs for a target role with pagination
   */
  async getAvailableRFQsByRolePaginated(
    targetRole: Role,
    filters?: { status?: string; type?: string },
    paginationQuery?: { page?: string; limit?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' },
    requesterCompanyId?: string
  ): Promise<PaginatedResponse<RFQResponse>> {
    const pagination = parsePaginationQuery(paginationQuery || {});
    const sort = buildSortObject(pagination.sortBy || 'deadline', pagination.sortOrder);

    const { rfqs, total } = await this.repository.findByTargetRolePaginated(
      targetRole,
      filters as any,
      {
        skip: pagination.skip,
        limit: pagination.limit,
        sortBy: Object.keys(sort)[0],
        sortOrder: Object.values(sort)[0] === 1 ? 'asc' : 'desc',
        companyId: requesterCompanyId,
      }
    );

    return createPaginationResult(
      rfqs.map((rfq) => this.toRFQResponse(rfq, requesterCompanyId)),
      total,
      pagination
    );
  }

  /**
   * Update RFQ
   */
  async updateRFQ(id: string, data: UpdateRFQDto): Promise<RFQResponse> {
    const rfq = await this.repository.findById(id);
    if (!rfq) {
      throw new AppError('RFQ not found', 404);
    }

    const updateData: Partial<IRFQ> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.items !== undefined) updateData.items = data.items;
    if (data.budget !== undefined) updateData.budget = data.budget;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.deadline) {
      updateData.deadline = new Date(data.deadline);
    }

    const updated = await this.repository.update(id, updateData);
    if (!updated) {
      throw new AppError('Failed to update RFQ', 500);
    }

    // Get requester company ID from RFQ
    return this.toRFQResponse(updated, updated.companyId.toString());
  }

  /**
   * Delete RFQ (soft delete)
   */
  async deleteRFQ(id: string): Promise<void> {
    const rfq = await this.repository.findById(id);
    if (!rfq) {
      throw new AppError('RFQ not found', 404);
    }

    await this.repository.softDelete(id);
  }

  /**
   * Get bids comparison data for an RFQ
   * Returns formatted data for side-by-side comparison
   */
  async getBidsComparison(rfqId: string): Promise<Array<{
    bidId: string;
    companyId: string;
    companyName?: string;
    price: number;
    currency: string;
    deliveryTime: number;
    deliveryDate: Date;
    aiScore?: number;
    paymentTerms: string;
    status: string;
    createdAt: Date;
  }>> {
    // Verify RFQ exists
    const rfq = await this.repository.findById(rfqId);
    if (!rfq) {
      throw new AppError('RFQ not found', 404);
    }

    // Get all bids for this RFQ
    const bids = await this.bidRepository.findByRFQId(rfqId);

    // Format bids for comparison
    const comparisonData = await Promise.all(
      bids.map(async (bid) => {
        let companyName: string | undefined;
        
        // Fetch company name if bid is not anonymous
        // Note: For buyer viewing bids, we show company name even if anonymous
        // because buyer needs to evaluate. But we should still respect anonymity flag
        // in the response structure.
        if (!bid.anonymousBidder) {
          const company = await this.companyRepository.findById(
            bid.companyId.toString()
          );
          companyName = company?.name;
        } else {
          companyName = 'Anonymous Bidder';
        }

        return {
          bidId: bid._id.toString(),
          companyId: bid.companyId.toString(),
          companyName,
          price: bid.price,
          currency: bid.currency,
          deliveryTime: bid.deliveryTime,
          deliveryDate: bid.deliveryDate,
          aiScore: bid.aiScore,
          paymentTerms: bid.paymentTerms,
          status: bid.status,
          createdAt: bid.createdAt,
        };
      })
    );

    return comparisonData;
  }

  /**
   * Enable anonymity for an RFQ
   * Only allowed before RFQ is open or if no bids exist
   */
  async enableAnonymity(
    id: string,
    requesterCompanyId: string
  ): Promise<RFQResponse> {
    const rfq = await this.repository.findById(id);
    if (!rfq) {
      throw new AppError('RFQ not found', 404);
    }

    // Enforce company isolation
    if (rfq.companyId.toString() !== requesterCompanyId) {
      throw new AppError('Access denied: RFQ belongs to different company', 403);
    }

    // Cannot enable anonymity if RFQ is already open and has bids
    if (rfq.status === RFQStatus.OPEN) {
      const bids = await this.bidRepository.findByRFQId(id);
      if (bids.length > 0) {
        throw new AppError(
          'Cannot enable anonymity: RFQ already has bids. Anonymity must be set before opening.',
          400
        );
      }
    }

    // Already anonymous
    if (rfq.anonymousBuyer) {
      return this.toRFQResponse(rfq, requesterCompanyId);
    }

    const updated = await this.repository.update(id, {
      anonymousBuyer: true,
    });

    if (!updated) {
      throw new AppError('Failed to enable anonymity', 500);
    }

    return this.toRFQResponse(updated, requesterCompanyId);
  }

  /**
   * Reveal identity for an anonymous RFQ
   * Irreversible action - requires explicit confirmation
   */
  async revealIdentity(
    id: string,
    requesterCompanyId: string,
    requesterRole?: string
  ): Promise<RFQResponse> {
    const rfq = await this.repository.findById(id);
    if (!rfq) {
      throw new AppError('RFQ not found', 404);
    }

    // Only buyer company or admin/government can reveal
    const canReveal = 
      rfq.companyId.toString() === requesterCompanyId ||
      requesterRole === 'ADMIN' ||
      requesterRole === 'GOVERNMENT';

    if (!canReveal) {
      throw new AppError('Access denied: Only RFQ owner or authorized roles can reveal identity', 403);
    }

    // Not anonymous
    if (!rfq.anonymousBuyer) {
      throw new AppError('RFQ is not anonymous', 400);
    }

    const updated = await this.repository.update(id, {
      anonymousBuyer: false,
    });

    if (!updated) {
      throw new AppError('Failed to reveal identity', 500);
    }

    return this.toRFQResponse(updated, requesterCompanyId);
  }

  /**
   * Convert IRFQ to RFQResponse
   * Sanitizes companyId when anonymous and requester is not the owner
   */
  private toRFQResponse(rfq: IRFQ, requesterCompanyId?: string): RFQResponse {
    const isOwner = requesterCompanyId && rfq.companyId.toString() === requesterCompanyId;
    const shouldHideIdentity = rfq.anonymousBuyer && !isOwner;

    return {
      id: rfq._id.toString(),
      purchaseRequestId: rfq.purchaseRequestId.toString(),
      // Hide companyId if anonymous and requester is not owner
      companyId: shouldHideIdentity ? 'ANONYMOUS' : rfq.companyId.toString(),
      type: rfq.type,
      targetRole: rfq.targetRole,
      targetCompanyType: rfq.targetCompanyType,
      targetCompanyIds: rfq.targetCompanyIds?.map((id) => id.toString()) || [],
      title: rfq.title,
      description: rfq.description,
      items: rfq.items,
      budget: rfq.budget,
      currency: rfq.currency,
      deliveryLocation: rfq.deliveryLocation,
      requiredDeliveryDate: rfq.requiredDeliveryDate,
      deadline: rfq.deadline,
      status: rfq.status,
      anonymousBuyer: rfq.anonymousBuyer,
      createdAt: rfq.createdAt,
      updatedAt: rfq.updatedAt,
    };
  }
}
