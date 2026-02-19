import { Bid, IBid } from './schema';
import { BidStatus } from './schema';
import mongoose from 'mongoose';
import { RFQRepository } from '../rfqs/repository';

export class BidRepository {
  private rfqRepository: RFQRepository;

  constructor() {
    this.rfqRepository = new RFQRepository();
  }

  /**
   * Create a new bid
   */
  async create(data: Partial<IBid>): Promise<IBid> {
    const bid = new Bid(data);
    return await bid.save();
  }

  /**
   * Find bid by ID
   */
  async findById(id: string): Promise<IBid | null> {
    return await Bid.findOne({ _id: id, deletedAt: null });
  }

  /**
   * Find bids by RFQ ID
   */
  async findByRFQId(
    rfqId: string,
    filters?: { status?: BidStatus }
  ): Promise<IBid[]> {
    const query: Record<string, unknown> = {
      rfqId: new mongoose.Types.ObjectId(rfqId),
      deletedAt: null,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    return await Bid.find(query).sort({ aiScore: -1, price: 1 });
  }

  /**
   * Find bid by RFQ and Company (for one bid per RFQ per company rule)
   */
  async findByRFQAndCompany(
    rfqId: string,
    companyId: string
  ): Promise<IBid | null> {
    return await Bid.findOne({
      rfqId: new mongoose.Types.ObjectId(rfqId),
      companyId: new mongoose.Types.ObjectId(companyId),
      deletedAt: null,
      status: { $nin: [BidStatus.WITHDRAWN, BidStatus.REJECTED] }, // Exclude withdrawn/rejected bids
    });
  }

  /**
   * Find bids by company ID
   */
  async findByCompanyId(
    companyId: string,
    filters?: { status?: BidStatus; rfqId?: string }
  ): Promise<IBid[]> {
    const query: Record<string, unknown> = {
      companyId: new mongoose.Types.ObjectId(companyId),
      deletedAt: null,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.rfqId) {
      query.rfqId = new mongoose.Types.ObjectId(filters.rfqId);
    }

    return await Bid.find(query).sort({ createdAt: -1 });
  }

  /**
   * Find bids by company ID with pagination
   */
  async findByCompanyIdPaginated(
    companyId: string,
    filters?: { status?: BidStatus; rfqId?: string },
    options?: { skip?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<{ bids: IBid[]; total: number }> {
    const query: Record<string, unknown> = {
      companyId: new mongoose.Types.ObjectId(companyId),
      deletedAt: null,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.rfqId) {
      query.rfqId = new mongoose.Types.ObjectId(filters.rfqId);
    }

    const sort: Record<string, 1 | -1> = {};
    if (options?.sortBy) {
      sort[options.sortBy] = options.sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    const skip = options?.skip || 0;
    const limit = options?.limit || 20;

    const [bids, total] = await Promise.all([
      Bid.find(query).sort(sort).skip(skip).limit(limit),
      Bid.countDocuments(query),
    ]);

    return { bids, total };
  }

  /**
   * Find bids by provider ID
   */
  async findByProviderId(
    providerId: string,
    filters?: { status?: BidStatus }
  ): Promise<IBid[]> {
    const query: Record<string, unknown> = {
      providerId: new mongoose.Types.ObjectId(providerId),
      deletedAt: null,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    return await Bid.find(query).sort({ createdAt: -1 });
  }

  /**
   * Update bid
   */
  async update(id: string, data: Partial<IBid>): Promise<IBid | null> {
    return await Bid.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  /**
   * Update AI score
   */
  async updateAIScore(id: string, score: number): Promise<void> {
    await Bid.findByIdAndUpdate(id, { aiScore: score, updatedAt: new Date() });
  }

  /**
   * Update AI score with full metadata
   */
  async updateAIScoreWithMetadata(id: string, scoreResult: {
    totalScore: number;
    breakdown: any;
    overallConfidence: string;
    overallRisk: string;
    recommendation: string;
    timestamp: Date;
    modelVersion?: string;
  }): Promise<void> {
    await Bid.findByIdAndUpdate(
      id,
      {
        aiScore: scoreResult.totalScore,
        aiScoreMetadata: scoreResult,
        updatedAt: new Date(),
      }
    );
  }

  /**
   * Soft delete bid
   */
  async softDelete(id: string): Promise<void> {
    await Bid.findByIdAndUpdate(id, { deletedAt: new Date() });
  }

  /**
   * Find bids by RFQ company (for buyers - all bids for RFQs they own)
   */
  async findByRFQCompany(
    rfqCompanyId: string,
    filters?: { status?: BidStatus; rfqId?: string }
  ): Promise<IBid[]> {
    // First, get all RFQ IDs for this buyer company
    const rfqs = await this.rfqRepository.findByCompanyId(rfqCompanyId);
    const rfqIds = rfqs.map((rfq) => rfq._id);

    if (rfqIds.length === 0) {
      return [];
    }

    const query: Record<string, unknown> = {
      rfqId: { $in: rfqIds },
      deletedAt: null,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.rfqId) {
      query.rfqId = new mongoose.Types.ObjectId(filters.rfqId);
    }

    return await Bid.find(query).sort({ createdAt: -1 });
  }

  /**
   * Find bids by RFQ company with pagination (for buyers)
   */
  async findByRFQCompanyPaginated(
    rfqCompanyId: string,
    filters?: { status?: BidStatus; rfqId?: string },
    options?: { skip?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<{ bids: IBid[]; total: number }> {
    // First, get all RFQ IDs for this buyer company
    const rfqs = await this.rfqRepository.findByCompanyId(rfqCompanyId);
    const rfqIds = rfqs.map((rfq) => rfq._id);

    if (rfqIds.length === 0) {
      return { bids: [], total: 0 };
    }

    const query: Record<string, unknown> = {
      rfqId: { $in: rfqIds },
      deletedAt: null,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.rfqId) {
      query.rfqId = new mongoose.Types.ObjectId(filters.rfqId);
    }

    const sort: Record<string, 1 | -1> = {};
    if (options?.sortBy) {
      sort[options.sortBy] = options.sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    const skip = options?.skip || 0;
    const limit = options?.limit || 20;

    const [bids, total] = await Promise.all([
      Bid.find(query).sort(sort).skip(skip).limit(limit),
      Bid.countDocuments(query),
    ]);

    return { bids, total };
  }

  /**
   * Find all bids (for analytics)
   */
  async findAll(filters?: { status?: BidStatus }): Promise<IBid[]> {
    const query: Record<string, unknown> = {
      deletedAt: null,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    return await Bid.find(query).sort({ createdAt: -1 });
  }
}
