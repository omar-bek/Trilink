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

    // Check if RFQ is still open
    if (rfq.status !== 'open') {
      throw new AppError('RFQ is not open for bidding', 400);
    }

    // Check if deadline has passed
    if (new Date() > rfq.deadline) {
      throw new AppError('RFQ deadline has passed', 400);
    }

    // Create bid
    const bid = await this.repository.create({
      ...data,
      providerId,
      companyId,
      deliveryDate: new Date(data.deliveryDate),
      status: BidStatus.SUBMITTED,
    });

    // Calculate AI score (async, non-blocking)
    this.aiScoringService.scoreBid(bid._id.toString(), {
      price: bid.price,
      deliveryTime: bid.deliveryTime,
      terms: bid.terms,
      rfqBudget: rfq.budget,
      rfqDeadline: rfq.deadline,
    }).then((score) => {
      this.repository.updateAIScore(bid._id.toString(), score);
    }).catch((error) => {
      console.error('AI scoring error:', error);
    });

    return this.toBidResponse(bid);
  }

  /**
   * Get bid by ID
   */
  async getBidById(id: string): Promise<BidResponse> {
    const bid = await this.repository.findById(id);
    if (!bid) {
      throw new AppError('Bid not found', 404);
    }
    return this.toBidResponse(bid);
  }

  /**
   * Get bids by RFQ
   */
  async getBidsByRFQ(
    rfqId: string,
    filters?: { status?: string }
  ): Promise<BidResponse[]> {
    const bids = await this.repository.findByRFQId(rfqId, filters as any);
    return bids.map((bid) => this.toBidResponse(bid));
  }

  /**
   * Get bids by company
   */
  async getBidsByCompany(
    companyId: string,
    filters?: { status?: string; rfqId?: string }
  ): Promise<BidResponse[]> {
    const bids = await this.repository.findByCompanyId(companyId, filters as any);
    return bids.map((bid) => this.toBidResponse(bid));
  }

  /**
   * Get bids by provider
   */
  async getBidsByProvider(
    providerId: string,
    filters?: { status?: string }
  ): Promise<BidResponse[]> {
    const bids = await this.repository.findByProviderId(providerId, filters as any);
    return bids.map((bid) => this.toBidResponse(bid));
  }

  /**
   * Update bid
   */
  async updateBid(id: string, data: UpdateBidDto): Promise<BidResponse> {
    const bid = await this.repository.findById(id);
    if (!bid) {
      throw new AppError('Bid not found', 404);
    }

    // Can only update if in draft or submitted status
    if (bid.status !== BidStatus.DRAFT && bid.status !== BidStatus.SUBMITTED) {
      throw new AppError('Bid cannot be updated in current status', 400);
    }

    const updateData: Partial<IBid> = { ...data };
    if (data.deliveryDate) {
      updateData.deliveryDate = new Date(data.deliveryDate);
    }

    const updated = await this.repository.update(id, updateData);
    if (!updated) {
      throw new AppError('Failed to update bid', 500);
    }

    return this.toBidResponse(updated);
  }

  /**
   * Evaluate bid (accept/reject)
   */
  async evaluateBid(id: string, data: EvaluateBidDto): Promise<BidResponse> {
    const bid = await this.repository.findById(id);
    if (!bid) {
      throw new AppError('Bid not found', 404);
    }

    if (bid.status !== BidStatus.SUBMITTED && bid.status !== BidStatus.UNDER_REVIEW) {
      throw new AppError('Bid cannot be evaluated in current status', 400);
    }

    const updated = await this.repository.update(id, {
      status: data.status,
    });

    if (!updated) {
      throw new AppError('Failed to evaluate bid', 500);
    }

    return this.toBidResponse(updated);
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
   * Convert IBid to BidResponse
   */
  private toBidResponse(bid: IBid): BidResponse {
    return {
      id: bid._id.toString(),
      rfqId: bid.rfqId.toString(),
      companyId: bid.companyId.toString(),
      providerId: bid.providerId.toString(),
      price: bid.price,
      currency: bid.currency,
      terms: bid.terms,
      deliveryTime: bid.deliveryTime,
      deliveryDate: bid.deliveryDate,
      aiScore: bid.aiScore,
      status: bid.status,
      isAnonymous: bid.isAnonymous,
      attachments: bid.attachments,
      createdAt: bid.createdAt,
      updatedAt: bid.updatedAt,
    };
  }
}
