import { PurchaseRequest, IPurchaseRequest } from './schema';
import { PurchaseRequestStatus } from './schema';
import mongoose from 'mongoose';

export class PurchaseRequestRepository {
  /**
   * Create a new purchase request
   */
  async create(data: Partial<IPurchaseRequest>): Promise<IPurchaseRequest> {
    const purchaseRequest = new PurchaseRequest(data);
    return await purchaseRequest.save();
  }

  /**
   * Find purchase request by ID
   */
  async findById(id: string): Promise<IPurchaseRequest | null> {
    return await PurchaseRequest.findOne({ _id: id, deletedAt: null });
  }

  /**
   * Find purchase requests by company ID
   * SECURITY FIX: Added optional category filtering for supplier companies
   */
  async findByCompanyId(
    companyId: string,
    filters?: { status?: PurchaseRequestStatus; buyerId?: string; categoryIds?: string[] }
  ): Promise<IPurchaseRequest[]> {
    const query: Record<string, unknown> = {
      companyId: new mongoose.Types.ObjectId(companyId),
      deletedAt: null,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.buyerId) {
      query.buyerId = new mongoose.Types.ObjectId(filters.buyerId);
    }

    // SECURITY FIX: Filter by category IDs if provided (for supplier companies)
    if (filters?.categoryIds && filters.categoryIds.length > 0) {
      query.categoryId = {
        $in: filters.categoryIds.map(id => new mongoose.Types.ObjectId(id))
      };
    }

    return await PurchaseRequest.find(query).sort({ createdAt: -1 });
  }

  /**
   * Find purchase requests by company ID with pagination
   * SECURITY FIX: Added optional category filtering for supplier companies
   */
  async findByCompanyIdPaginated(
    companyId: string,
    filters?: { status?: PurchaseRequestStatus; buyerId?: string; categoryIds?: string[] },
    options?: { skip?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<{ purchaseRequests: IPurchaseRequest[]; total: number }> {
    const query: Record<string, unknown> = {
      companyId: new mongoose.Types.ObjectId(companyId),
      deletedAt: null,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.buyerId) {
      query.buyerId = new mongoose.Types.ObjectId(filters.buyerId);
    }

    // SECURITY FIX: Filter by category IDs if provided (for supplier companies)
    if (filters?.categoryIds && filters.categoryIds.length > 0) {
      query.categoryId = {
        $in: filters.categoryIds.map(id => new mongoose.Types.ObjectId(id))
      };
    }

    const sort: Record<string, 1 | -1> = {};
    if (options?.sortBy) {
      sort[options.sortBy] = options.sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    const skip = options?.skip || 0;
    const limit = options?.limit || 20;

    const [purchaseRequests, total] = await Promise.all([
      PurchaseRequest.find(query).sort(sort).skip(skip).limit(limit),
      PurchaseRequest.countDocuments(query),
    ]);

    return { purchaseRequests, total };
  }

  /**
   * Update purchase request
   */
  async update(
    id: string,
    data: Partial<IPurchaseRequest>
  ): Promise<IPurchaseRequest | null> {
    return await PurchaseRequest.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  /**
   * Soft delete purchase request
   */
  async softDelete(id: string): Promise<void> {
    await PurchaseRequest.findByIdAndUpdate(id, { deletedAt: new Date() });
  }

  /**
   * Mark RFQ as generated
   */
  async markRfqGenerated(id: string): Promise<void> {
    await PurchaseRequest.findByIdAndUpdate(id, { rfqGenerated: true });
  }

  /**
   * Add approval history entry
   */
  async addApprovalHistory(
    id: string,
    historyEntry: {
      status: PurchaseRequestStatus;
      approverId?: string;
      approverName?: string;
      notes?: string;
      timestamp: Date;
    }
  ): Promise<void> {
    const historyData: any = {
      status: historyEntry.status,
      timestamp: historyEntry.timestamp,
    };

    if (historyEntry.approverId) {
      historyData.approverId = new mongoose.Types.ObjectId(historyEntry.approverId);
    }

    if (historyEntry.approverName) {
      historyData.approverName = historyEntry.approverName;
    }

    if (historyEntry.notes) {
      historyData.notes = historyEntry.notes;
    }

    await PurchaseRequest.findByIdAndUpdate(
      id,
      { $push: { approvalHistory: historyData } },
      { new: true }
    );
  }

  /**
   * Find all purchase requests (for analytics)
   */
  async findAll(filters?: { status?: PurchaseRequestStatus }): Promise<IPurchaseRequest[]> {
    const query: Record<string, unknown> = {
      deletedAt: null,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    return await PurchaseRequest.find(query).sort({ createdAt: -1 });
  }
}
