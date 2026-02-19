import { Bid, IBid } from './schema';
import { BidStatus } from './schema';
import mongoose from 'mongoose';

export class BidRepository {
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
   * Soft delete bid
   */
  async softDelete(id: string): Promise<void> {
    await Bid.findByIdAndUpdate(id, { deletedAt: new Date() });
  }
}
