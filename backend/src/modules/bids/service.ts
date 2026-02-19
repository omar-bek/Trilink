import { BidRepository } from './repository';
import {
  CreateBidDto,
  UpdateBidDto,
  EvaluateBidDto,
  BidResponse,
} from './types';
import { AppError } from '../../middlewares/error.middleware';
import { IBid, BidStatus } from './schema';
import { RFQRepository } from '../rfqs/repository';
import { AIScoringService } from './ai-scoring.service';
import { RFQStatus } from '../rfqs/schema';
import { Role } from '../../config/rbac';
import { ContractService } from '../contracts/service';
import { PurchaseRequestRepository } from '../purchase-requests/repository';
import { logger } from '../../utils/logger';
import { getSocketService } from '../../socket/socket.service';
import { SocketEvent } from '../../socket/types';
import { PaginatedResponse } from '../../types/common';
import { parsePaginationQuery, createPaginationResult, buildSortObject } from '../../utils/pagination';
import { createAuditLog } from '../../middlewares/audit.middleware';
import { AuditAction, AuditResource } from '../audit/schema';
import { config } from '../../config/env';
import { notificationService, NotificationEvent } from '../notifications';
import { notificationHelpers } from '../notifications/helpers';

export class BidService {
  private repository: BidRepository;
  private rfqRepository: RFQRepository;
  private aiScoringService: AIScoringService;

  constructor() {
    this.repository = new BidRepository();
    this.rfqRepository = new RFQRepository();
    this.aiScoringService = new AIScoringService();
  }

  /**
   * Create a new bid
   * Rule: One bid per RFQ per company
   */
  async createBid(
    providerId: string,
    companyId: string,
    data: CreateBidDto
  ): Promise<BidResponse> {
    // Verify RFQ exists
    const rfq = await this.rfqRepository.findById(data.rfqId);
    if (!rfq) {
      throw new AppError('RFQ not found', 404);
    }

    // Prevent bidding on own company's RFQ
    if (rfq.companyId.toString() === companyId) {
      throw new AppError('You cannot submit a bid for an RFQ created by your own company', 400);
    }

    // Check if RFQ is still open
    if (rfq.status !== RFQStatus.OPEN) {
      throw new AppError('RFQ is not open for bidding', 400);
    }

    // Check if deadline has passed
    if (new Date() > rfq.deadline) {
      throw new AppError('RFQ deadline has passed', 400);
    }

    // Rule: One bid per RFQ per company
    const existingBid = await this.repository.findByRFQAndCompany(
      data.rfqId,
      companyId
    );
    if (existingBid) {
      throw new AppError(
        'A bid already exists for this RFQ from your company. You can update or withdraw the existing bid.',
        400
      );
    }

    // Validate validity date is in the future
    const validityDate = new Date(data.validity);
    if (validityDate <= new Date()) {
      throw new AppError('Bid validity date must be in the future', 400);
    }

    // Calculate total price from items if provided, otherwise use provided price
    let totalPrice = data.price;
    if (data.items && data.items.length > 0) {
      totalPrice = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    // Validate payment schedule if provided
    if (data.paymentSchedule && data.paymentSchedule.length > 0) {
      // Validate percentages total 100%
      const totalPercentage = data.paymentSchedule.reduce((sum, payment) => {
        return sum + (payment.percentage || 0);
      }, 0);

      if (Math.abs(totalPercentage - 100) > 0.01) { // Allow small floating point differences
        throw new AppError(
          `Payment schedule percentages must total 100%. Current total: ${totalPercentage.toFixed(2)}%`,
          400
        );
      }

      // Validate amounts total equals bid price (if amounts are provided)
      const totalAmount = data.paymentSchedule.reduce((sum, payment) => {
        return sum + (payment.amount || 0);
      }, 0);

      if (totalAmount > 0 && Math.abs(totalAmount - totalPrice) > 0.01) {
        throw new AppError(
          `Payment schedule amounts must total ${totalPrice.toFixed(2)}. Current total: ${totalAmount.toFixed(2)}`,
          400
        );
      }

      // Convert dueDate strings to Date objects
      data.paymentSchedule = data.paymentSchedule.map(payment => ({
        ...payment,
        dueDate: payment.dueDate ? new Date(payment.dueDate) : undefined,
      }));
    }

    // Create bid
    const bid = await this.repository.create({
      ...data,
      price: totalPrice, // Use calculated total price
      providerId,
      companyId,
      deliveryDate: new Date(data.deliveryDate),
      validity: validityDate,
      status: BidStatus.SUBMITTED,
    });

    // Calculate AI score (async, non-blocking) - only if AI is enabled
    if (config.ai.enabled) {
      this.aiScoringService.scoreBid(bid._id.toString(), {
        price: bid.price,
        deliveryTime: bid.deliveryTime,
        paymentTerms: bid.paymentTerms,
        rfqBudget: rfq.budget,
        rfqDeadline: rfq.deadline,
        providerId: providerId,
        companyId: companyId,
      }).then((scoreResult) => {
        // Update bid with full AI score metadata
        this.repository.updateAIScoreWithMetadata(bid._id.toString(), {
          totalScore: scoreResult.totalScore,
          breakdown: scoreResult.breakdown,
          overallConfidence: scoreResult.overallConfidence,
          overallRisk: scoreResult.overallRisk,
          recommendation: scoreResult.recommendation,
          timestamp: scoreResult.timestamp,
          modelVersion: scoreResult.modelVersion,
        });

        // Log AI decision for audit trail
        createAuditLog(
          providerId,
          companyId,
          AuditAction.EVALUATE,
          AuditResource.BID,
          {
            resourceId: bid._id.toString(),
            after: {
              aiScore: scoreResult.totalScore,
              aiDecision: {
                score: scoreResult.totalScore,
                confidence: scoreResult.overallConfidence,
                risk: scoreResult.overallRisk,
                recommendation: scoreResult.recommendation,
                breakdown: scoreResult.breakdown,
                timestamp: scoreResult.timestamp,
                modelVersion: scoreResult.modelVersion,
              },
            },
          },
          'success'
        ).catch((error) => {
          logger.error('Failed to log AI decision audit:', error);
        });
      }).catch((error) => {
        logger.error('AI scoring error:', error);
        // Log AI scoring failure
        createAuditLog(
          providerId,
          companyId,
          AuditAction.EVALUATE,
          AuditResource.BID,
          {
            resourceId: bid._id.toString(),
            after: {
              aiDecision: {
                error: 'AI scoring failed',
                errorMessage: error.message,
              },
            },
          },
          'failure',
          error.message
        ).catch((auditError) => {
          logger.error('Failed to log AI error audit:', auditError);
        });
      });
    }

    // Send notification to buyer about new bid submission
    try {
      const buyerRecipients = await notificationHelpers.getRecipientsByCompany(
        rfq.companyId.toString(),
        [Role.BUYER]
      );

      if (buyerRecipients.length > 0) {
        await notificationService.sendBidSubmittedNotification(
          bid,
          rfq,
          buyerRecipients
        );
      }
    } catch (error) {
      logger.error('Failed to send bid submission notification:', error);
      // Don't fail the request if notification fails
    }

    // Notify company managers (both buyer and supplier companies)
    try {
      // Notify buyer company managers
      await notificationService.notifyCompanyManagers(
        rfq.companyId.toString(),
        NotificationEvent.BID_SUBMITTED,
        {
          title: `New Bid Submitted for RFQ: ${rfq.title}`,
          message: `A new bid has been submitted by ${bid.companyId?.name || 'a supplier'} for RFQ ${rfq.title}. Price: ${bid.currency} ${bid.price?.toLocaleString()}`,
          entityType: 'bid',
          entityId: bid._id.toString(),
          actionUrl: `${config.FRONTEND_URL || 'http://localhost:3001'}/bids/${bid._id}`,
          rfqId: rfq._id.toString(),
          rfqTitle: rfq.title,
          bidId: bid._id.toString(),
          companyName: bid.companyId?.name || 'Supplier',
          price: `${bid.currency} ${bid.price?.toLocaleString()}`,
          deliveryTime: `${bid.deliveryTime} days`,
        }
      );

      // Notify supplier company managers
      await notificationService.notifyCompanyManagers(
        companyId,
        NotificationEvent.BID_SUBMITTED,
        {
          title: `Bid Submitted Successfully`,
          message: `Your bid for RFQ "${rfq.title}" has been submitted successfully. Price: ${bid.currency} ${bid.price?.toLocaleString()}`,
          entityType: 'bid',
          entityId: bid._id.toString(),
          actionUrl: `${config.FRONTEND_URL || 'http://localhost:3001'}/bids/${bid._id}`,
          rfqId: rfq._id.toString(),
          rfqTitle: rfq.title,
          bidId: bid._id.toString(),
          price: `${bid.currency} ${bid.price?.toLocaleString()}`,
        }
      );
    } catch (error) {
      logger.error('Failed to notify company managers about bid submission:', error);
    }

    // Emit socket event for bid submission
    try {
      const socketService = getSocketService();
      const purchaseRequestRepository = new PurchaseRequestRepository();
      const purchaseRequest = await purchaseRequestRepository.findById(
        rfq.purchaseRequestId.toString()
      );

      if (purchaseRequest) {
        socketService.emitBidEvent(
          SocketEvent.BID_SUBMITTED,
          {
            bidId: bid._id.toString(),
            rfqId: rfq._id.toString(),
            companyId: companyId,
            providerId: providerId,
            price: bid.price,
            currency: bid.currency,
            status: bid.status,
            rfqTitle: rfq.title,
          },
          [purchaseRequest.companyId.toString()] // Notify buyer company
        );
      }
    } catch (error) {
      logger.error('Failed to emit bid submitted socket event:', error);
    }

    // Return bid response - requester is the bid creator (provider)
    return this.toBidResponse(bid, companyId, undefined);
  }

  /**
   * Get bid by ID
   * Buyer (RFQ owner) can view all bids for their RFQs
   * Providers can only view their own company's bids
   */
  async getBidById(
    id: string,
    requesterRole?: Role,
    requesterCompanyId?: string
  ): Promise<BidResponse> {
    const bid = await this.repository.findById(id);
    if (!bid) {
      throw new AppError('Bid not found', 404);
    }

    // Admin and Government can view all bids
    if (requesterRole === Role.ADMIN || requesterRole === Role.GOVERNMENT) {
      return this.toBidResponse(bid, requesterCompanyId, requesterRole);
    }

    // Check if requester is the RFQ owner (buyer)
    const rfq = await this.rfqRepository.findById(bid.rfqId.toString());
    if (!rfq) {
      throw new AppError('RFQ not found', 404);
    }

    const isRFQOwner = rfq.companyId.toString() === requesterCompanyId;
    const isBidOwner = bid.companyId.toString() === requesterCompanyId;

    // RFQ owner (buyer) can view all bids for their RFQs
    if (isRFQOwner) {
      return this.toBidResponse(bid, requesterCompanyId, requesterRole);
    }

    // Providers can only view their own company's bids
    if (isBidOwner) {
      return this.toBidResponse(bid, requesterCompanyId, requesterRole);
    }

    // Company Manager can view bids if their company is the RFQ owner or bid owner
    if (requesterRole === Role.COMPANY_MANAGER && (isRFQOwner || isBidOwner)) {
      return this.toBidResponse(bid, requesterCompanyId, requesterRole);
    }

    throw new AppError('Access denied: Bid belongs to different company', 403);
  }

  /**
   * Get bids by RFQ
   * Buyer (RFQ owner) can view all bids for their RFQs
   * Providers can only view their own company's bids
   */
  async getBidsByRFQ(
    rfqId: string,
    filters?: { status?: string },
    requesterRole?: Role,
    requesterCompanyId?: string
  ): Promise<BidResponse[]> {
    const bids = await this.repository.findByRFQId(rfqId, filters as any);

    // Admin and Government can view all bids
    if (requesterRole === Role.ADMIN || requesterRole === Role.GOVERNMENT) {
      return bids.map((bid) => this.toBidResponse(bid, requesterCompanyId, requesterRole));
    }

    // Check if requester is the RFQ owner (buyer)
    const rfq = await this.rfqRepository.findById(rfqId);
    if (!rfq) {
      throw new AppError('RFQ not found', 404);
    }

    const isRFQOwner = rfq.companyId.toString() === requesterCompanyId;

    // RFQ owner (buyer) can see all bids for their RFQs
    if (isRFQOwner) {
      return bids.map((bid) => this.toBidResponse(bid, requesterCompanyId, requesterRole));
    }

    // Company Manager can view bids if their company is the RFQ owner
    if (requesterRole === Role.COMPANY_MANAGER && isRFQOwner) {
      return bids.map((bid) => this.toBidResponse(bid, requesterCompanyId, requesterRole));
    }

    // Providers can only see their own company's bid
    const filteredBids = bids.filter(bid => bid.companyId.toString() === requesterCompanyId);
    return filteredBids.map((bid) => this.toBidResponse(bid, requesterCompanyId, requesterRole));
  }

  /**
   * Get bids by company
   * For buyers: returns all bids for RFQs they own
   * For providers: returns bids they submitted
   */
  async getBidsByCompany(
    companyId: string,
    filters?: { status?: string; rfqId?: string },
    requesterRole?: Role
  ): Promise<BidResponse[]> {
    // Buyers see all bids for their RFQs
    if (requesterRole === Role.BUYER || requesterRole === Role.ADMIN || requesterRole === Role.GOVERNMENT || requesterRole === Role.COMPANY_MANAGER) {
      const bids = await this.repository.findByRFQCompany(companyId, filters as any);
      return bids.map((bid) => this.toBidResponse(bid, companyId, requesterRole));
    }

    // Providers see only their own bids
    const bids = await this.repository.findByCompanyId(companyId, filters as any);
    return bids.map((bid) => this.toBidResponse(bid, companyId, requesterRole));
  }

  /**
   * Get bids by company with pagination
   * For buyers: returns all bids for RFQs they own
   * For providers: returns bids they submitted
   */
  async getBidsByCompanyPaginated(
    companyId: string,
    filters?: { status?: string; rfqId?: string },
    paginationQuery?: { page?: string; limit?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' },
    requesterRole?: Role
  ): Promise<PaginatedResponse<BidResponse>> {
    const pagination = parsePaginationQuery(paginationQuery || {});
    const sort = buildSortObject(pagination.sortBy || 'createdAt', pagination.sortOrder);

    // Buyers see all bids for their RFQs
    if (requesterRole === Role.BUYER || requesterRole === Role.ADMIN || requesterRole === Role.GOVERNMENT || requesterRole === Role.COMPANY_MANAGER) {
      const { bids, total } = await this.repository.findByRFQCompanyPaginated(
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
        bids.map((bid) => this.toBidResponse(bid, companyId, requesterRole)),
        total,
        pagination
      );
    }

    // Providers see only their own bids
    const { bids, total } = await this.repository.findByCompanyIdPaginated(
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
      bids.map((bid) => this.toBidResponse(bid, companyId, requesterRole)),
      total,
      pagination
    );
  }

  /**
   * Get bids by provider
   */
  async getBidsByProvider(
    providerId: string,
    filters?: { status?: string },
    requesterCompanyId?: string,
    requesterRole?: Role
  ): Promise<BidResponse[]> {
    const bids = await this.repository.findByProviderId(providerId, filters as any);
    return bids.map((bid) => this.toBidResponse(bid, requesterCompanyId, requesterRole));
  }

  /**
   * Update bid
   * Status lifecycle: Only draft or submitted bids can be updated
   */
  async updateBid(
    id: string,
    data: UpdateBidDto,
    requesterCompanyId?: string
  ): Promise<BidResponse> {
    const bid = await this.repository.findById(id);
    if (!bid) {
      throw new AppError('Bid not found', 404);
    }

    // Enforce company isolation
    if (requesterCompanyId && bid.companyId.toString() !== requesterCompanyId) {
      throw new AppError('Access denied: Bid belongs to different company', 403);
    }

    // Status lifecycle: Only draft or submitted bids can be updated
    if (bid.status !== BidStatus.DRAFT && bid.status !== BidStatus.SUBMITTED) {
      throw new AppError(
        `Bid cannot be updated in current status: ${bid.status}. Only draft or submitted bids can be updated.`,
        400
      );
    }

    // Prevent status changes through update endpoint
    if (data.status && data.status !== BidStatus.DRAFT && data.status !== BidStatus.SUBMITTED) {
      throw new AppError('Cannot change status through update. Use withdraw or evaluate endpoints.', 400);
    }

    const updateData: Partial<IBid> = { ...data };
    if (data.deliveryDate) {
      updateData.deliveryDate = new Date(data.deliveryDate);
    }
    if (data.validity) {
      const validityDate = new Date(data.validity);
      if (validityDate <= new Date()) {
        throw new AppError('Bid validity date must be in the future', 400);
      }
      updateData.validity = validityDate;
    }

    const updated = await this.repository.update(id, updateData);
    if (!updated) {
      throw new AppError('Failed to update bid', 500);
    }

    return this.toBidResponse(updated, requesterCompanyId, undefined);
  }

  /**
   * Withdraw bid
   * Status lifecycle: Only submitted bids can be withdrawn
   */
  async withdrawBid(
    id: string,
    requesterCompanyId?: string
  ): Promise<BidResponse> {
    const bid = await this.repository.findById(id);
    if (!bid) {
      throw new AppError('Bid not found', 404);
    }

    // Enforce company isolation
    if (requesterCompanyId && bid.companyId.toString() !== requesterCompanyId) {
      throw new AppError('Access denied: Bid belongs to different company', 403);
    }

    // Status lifecycle: Only submitted bids can be withdrawn
    if (bid.status !== BidStatus.SUBMITTED) {
      throw new AppError(
        `Bid cannot be withdrawn in current status: ${bid.status}. Only submitted bids can be withdrawn.`,
        400
      );
    }

    const updated = await this.repository.update(id, {
      status: BidStatus.WITHDRAWN,
    });

    if (!updated) {
      throw new AppError('Failed to withdraw bid', 500);
    }

    // Emit socket event for bid withdrawal
    try {
      const socketService = getSocketService();
      const rfqRepository = new RFQRepository();
      const rfq = await rfqRepository.findById(bid.rfqId.toString());

      if (rfq) {
        const purchaseRequestRepository = new PurchaseRequestRepository();
        const purchaseRequest = await purchaseRequestRepository.findById(
          rfq.purchaseRequestId.toString()
        );

        if (purchaseRequest) {
          socketService.emitBidEvent(
            SocketEvent.BID_WITHDRAWN,
            {
              bidId: updated._id.toString(),
              rfqId: rfq._id.toString(),
              companyId: updated.companyId.toString(),
              providerId: updated.providerId.toString(),
              price: updated.price,
              currency: updated.currency,
              status: updated.status,
            },
            [purchaseRequest.companyId.toString()] // Notify buyer company
          );
        }
      }
    } catch (error) {
      logger.error('Failed to emit bid withdrawn socket event:', error);
    }

    // Notify company managers about bid withdrawal
    try {
      const rfq = await this.rfqRepository.findById(bid.rfqId.toString());
      if (rfq) {
        // Notify buyer company managers
        await notificationService.notifyCompanyManagers(
          rfq.companyId.toString(),
          NotificationEvent.BID_WITHDRAWN,
          {
            title: `Bid Withdrawn for RFQ: ${rfq.title}`,
            message: `A bid has been withdrawn by ${updated.companyId?.name || 'a supplier'} for RFQ "${rfq.title}".`,
            entityType: 'bid',
            entityId: updated._id.toString(),
            actionUrl: `${config.FRONTEND_URL || 'http://localhost:3001'}/bids/${updated._id}`,
            rfqId: rfq._id.toString(),
            rfqTitle: rfq.title,
            bidId: updated._id.toString(),
            companyName: updated.companyId?.name || 'Supplier',
          }
        );

        // Notify supplier company managers
        await notificationService.notifyCompanyManagers(
          updated.companyId.toString(),
          NotificationEvent.BID_WITHDRAWN,
          {
            title: `Bid Withdrawn`,
            message: `Your bid for RFQ "${rfq.title}" has been withdrawn.`,
            entityType: 'bid',
            entityId: updated._id.toString(),
            actionUrl: `${config.FRONTEND_URL || 'http://localhost:3001'}/bids/${updated._id}`,
            rfqId: rfq._id.toString(),
            rfqTitle: rfq.title,
            bidId: updated._id.toString(),
          }
        );
      }
    } catch (error) {
      logger.error('Failed to notify company managers about bid withdrawal:', error);
    }

    return this.toBidResponse(updated, requesterCompanyId, undefined);
  }

  /**
   * Evaluate bid (accept/reject)
   * Status lifecycle: Only submitted or under_review bids can be evaluated
   * Auto-generates contract when bid is accepted
   */
  async evaluateBid(id: string, data: EvaluateBidDto, requesterCompanyId?: string): Promise<BidResponse> {
    const bid = await this.repository.findById(id);
    if (!bid) {
      throw new AppError('Bid not found', 404);
    }

    // Authorization: Only RFQ owner (buyer) or admin can evaluate bids
    if (requesterCompanyId) {
      const rfqRepository = new RFQRepository();
      const rfq = await rfqRepository.findById(bid.rfqId.toString());
      if (!rfq) {
        throw new AppError('RFQ not found', 404);
      }

      // Check if requester is the RFQ owner (buyer)
      if (rfq.companyId.toString() !== requesterCompanyId) {
        throw new AppError('Access denied: Only the RFQ owner (buyer) can evaluate bids', 403);
      }
    }

    // Status lifecycle: Only submitted or under_review bids can be evaluated
    if (bid.status !== BidStatus.SUBMITTED && bid.status !== BidStatus.UNDER_REVIEW) {
      throw new AppError(
        `Bid cannot be evaluated in current status: ${bid.status}. Only submitted or under_review bids can be evaluated.`,
        400
      );
    }

    // Validate status transition
    if (data.status !== BidStatus.ACCEPTED && data.status !== BidStatus.REJECTED && data.status !== BidStatus.UNDER_REVIEW) {
      throw new AppError('Invalid evaluation status. Must be accepted, rejected, or under_review', 400);
    }

    const updated = await this.repository.update(id, {
      status: data.status,
    });

    if (!updated) {
      throw new AppError('Failed to evaluate bid', 500);
    }

    // Auto-generate contract when bid is accepted
    if (data.status === BidStatus.ACCEPTED) {
      try {
        // Get RFQ to find purchase request
        const rfqRepository = new RFQRepository();
        const rfq = await rfqRepository.findById(bid.rfqId.toString());
        if (rfq) {
          // Get purchase request to find buyer
          const purchaseRequestRepository = new PurchaseRequestRepository();
          const purchaseRequest = await purchaseRequestRepository.findById(
            rfq.purchaseRequestId.toString()
          );
          if (purchaseRequest) {
            // Auto-generate contract
            const contractService = new ContractService();
            await contractService.generateContractFromAcceptedBids(
              purchaseRequest._id.toString(),
              purchaseRequest.companyId.toString(),
              purchaseRequest.buyerId.toString()
            );
          }
        }
      } catch (error) {
        // Log error but don't fail bid evaluation
        logger.error(`Failed to auto-generate contract for accepted bid ${id}:`, error);
      }
    }

    // Emit socket event for bid evaluation
    try {
      const socketService = getSocketService();
      const rfqRepository = new RFQRepository();
      const rfq = await rfqRepository.findById(bid.rfqId.toString());

      if (rfq) {
        const purchaseRequestRepository = new PurchaseRequestRepository();
        const purchaseRequest = await purchaseRequestRepository.findById(
          rfq.purchaseRequestId.toString()
        );

        if (purchaseRequest) {
          const eventType = data.status === BidStatus.ACCEPTED
            ? SocketEvent.BID_ACCEPTED
            : SocketEvent.BID_REJECTED;

          socketService.emitBidEvent(
            eventType,
            {
              bidId: updated._id.toString(),
              rfqId: rfq._id.toString(),
              companyId: updated.companyId.toString(),
              providerId: updated.providerId.toString(),
              price: updated.price,
              currency: updated.currency,
              status: updated.status,
              notes: data.notes,
            },
            [
              purchaseRequest.companyId.toString(), // Buyer company
              updated.companyId.toString(), // Provider company
            ]
          );
        }
      }
    } catch (error) {
      logger.error('Failed to emit bid evaluation socket event:', error);
    }

    // Notify company managers about bid evaluation
    try {
      const rfqRepository = new RFQRepository();
      const rfq = await rfqRepository.findById(bid.rfqId.toString());

      if (rfq) {
        const purchaseRequestRepository = new PurchaseRequestRepository();
        const purchaseRequest = await purchaseRequestRepository.findById(
          rfq.purchaseRequestId.toString()
        );

        if (purchaseRequest) {
          const isAccepted = data.status === BidStatus.ACCEPTED;
          const eventType = isAccepted ? NotificationEvent.BID_ACCEPTED : NotificationEvent.BID_REJECTED;

          // Notify buyer company managers
          await notificationService.notifyCompanyManagers(
            purchaseRequest.companyId.toString(),
            eventType,
            {
              title: isAccepted 
                ? `Bid Accepted for RFQ: ${rfq.title}`
                : `Bid Rejected for RFQ: ${rfq.title}`,
              message: isAccepted
                ? `A bid has been accepted for RFQ "${rfq.title}". Price: ${updated.currency} ${updated.price?.toLocaleString()}`
                : `A bid has been rejected for RFQ "${rfq.title}". ${data.notes ? `Notes: ${data.notes}` : ''}`,
              entityType: 'bid',
              entityId: updated._id.toString(),
              actionUrl: `${config.FRONTEND_URL || 'http://localhost:3001'}/bids/${updated._id}`,
              rfqId: rfq._id.toString(),
              rfqTitle: rfq.title,
              bidId: updated._id.toString(),
              companyName: updated.companyId?.name || 'Supplier',
              price: `${updated.currency} ${updated.price?.toLocaleString()}`,
              notes: data.notes,
            }
          );

          // Notify supplier company managers
          await notificationService.notifyCompanyManagers(
            updated.companyId.toString(),
            eventType,
            {
              title: isAccepted 
                ? `Your Bid Has Been Accepted!`
                : `Your Bid Has Been Rejected`,
              message: isAccepted
                ? `Congratulations! Your bid for RFQ "${rfq.title}" has been accepted. Price: ${updated.currency} ${updated.price?.toLocaleString()}`
                : `Your bid for RFQ "${rfq.title}" has been rejected. ${data.notes ? `Reason: ${data.notes}` : ''}`,
              entityType: 'bid',
              entityId: updated._id.toString(),
              actionUrl: `${config.FRONTEND_URL || 'http://localhost:3001'}/bids/${updated._id}`,
              rfqId: rfq._id.toString(),
              rfqTitle: rfq.title,
              bidId: updated._id.toString(),
              price: `${updated.currency} ${updated.price?.toLocaleString()}`,
              notes: data.notes,
            }
          );
        }
      }
    } catch (error) {
      logger.error('Failed to notify company managers about bid evaluation:', error);
    }

    return this.toBidResponse(updated, requesterCompanyId, undefined);
  }

  /**
   * Delete bid (soft delete)
   */
  async deleteBid(id: string): Promise<void> {
    const bid = await this.repository.findById(id);
    if (!bid) {
      throw new AppError('Bid not found', 404);
    }

    await this.repository.softDelete(id);
  }

  /**
   * Enable anonymity for a bid
   * Only allowed for draft or submitted bids
   */
  async enableAnonymity(
    id: string,
    requesterCompanyId: string
  ): Promise<BidResponse> {
    const bid = await this.repository.findById(id);
    if (!bid) {
      throw new AppError('Bid not found', 404);
    }

    // Enforce company isolation
    if (bid.companyId.toString() !== requesterCompanyId) {
      throw new AppError('Access denied: Bid belongs to different company', 403);
    }

    // Cannot enable anonymity if bid is already evaluated
    if (bid.status === BidStatus.ACCEPTED || bid.status === BidStatus.REJECTED) {
      throw new AppError(
        'Cannot enable anonymity: Bid has already been evaluated. Anonymity must be set before evaluation.',
        400
      );
    }

    // Already anonymous
    if (bid.anonymousBidder) {
      return this.toBidResponse(bid, requesterCompanyId, undefined);
    }

    const updated = await this.repository.update(id, {
      anonymousBidder: true,
    });

    if (!updated) {
      throw new AppError('Failed to enable anonymity', 500);
    }

    return this.toBidResponse(updated, requesterCompanyId, undefined);
  }

  /**
   * Reveal identity for an anonymous bid
   * Irreversible action - requires explicit confirmation
   * Only buyer (RFQ owner) or admin/government can reveal
   */
  async revealIdentity(
    id: string,
    requesterCompanyId: string,
    requesterRole?: Role
  ): Promise<BidResponse> {
    const bid = await this.repository.findById(id);
    if (!bid) {
      throw new AppError('Bid not found', 404);
    }

    // Get RFQ to check ownership
    const rfq = await this.rfqRepository.findById(bid.rfqId.toString());
    if (!rfq) {
      throw new AppError('RFQ not found', 404);
    }

    // Only buyer (RFQ owner), bid owner, or admin/government can reveal
    const isRFQOwner = rfq.companyId.toString() === requesterCompanyId;
    const isBidOwner = bid.companyId.toString() === requesterCompanyId;
    const isAuthorized = requesterRole === Role.ADMIN || requesterRole === Role.GOVERNMENT;

    if (!isRFQOwner && !isBidOwner && !isAuthorized) {
      throw new AppError('Access denied: Only RFQ owner, bid owner, or authorized roles can reveal identity', 403);
    }

    // Not anonymous
    if (!bid.anonymousBidder) {
      throw new AppError('Bid is not anonymous', 400);
    }

    const updated = await this.repository.update(id, {
      anonymousBidder: false,
    });

    if (!updated) {
      throw new AppError('Failed to reveal identity', 500);
    }

    return this.toBidResponse(updated, requesterCompanyId, requesterRole);
  }

  /**
   * Convert IBid to BidResponse
   * Sanitizes companyId and providerId when anonymous and requester is not authorized
   */
  private toBidResponse(
    bid: IBid,
    requesterCompanyId?: string,
    requesterRole?: Role
  ): BidResponse {
    const isBidOwner = requesterCompanyId && bid.companyId.toString() === requesterCompanyId;
    const isAuthorized = requesterRole === Role.BUYER || requesterRole === Role.ADMIN || requesterRole === Role.GOVERNMENT;
    const shouldHideIdentity = bid.anonymousBidder && !isBidOwner && !isAuthorized;

    return {
      id: bid._id.toString(),
      rfqId: bid.rfqId.toString(),
      // Hide companyId and providerId if anonymous and requester is not authorized
      companyId: shouldHideIdentity ? 'ANONYMOUS' : bid.companyId.toString(),
      providerId: shouldHideIdentity ? 'ANONYMOUS' : bid.providerId.toString(),
      price: bid.price,
      currency: bid.currency,
      paymentTerms: bid.paymentTerms,
      paymentSchedule: bid.paymentSchedule?.map(payment => ({
        milestone: payment.milestone,
        amount: payment.amount,
        percentage: payment.percentage,
        dueDate: payment.dueDate,
        description: payment.description,
      })),
      deliveryTime: bid.deliveryTime,
      deliveryDate: bid.deliveryDate,
      validity: bid.validity,
      items: bid.items?.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
      })),
      aiScore: bid.aiScore,
      aiScoreMetadata: bid.aiScoreMetadata,
      status: bid.status,
      anonymousBidder: bid.anonymousBidder,
      attachments: bid.attachments,
      createdAt: bid.createdAt,
      updatedAt: bid.updatedAt,
    };
  }
}
