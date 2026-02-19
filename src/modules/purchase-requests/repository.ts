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
   */
  async findByCompanyId(
    companyId: string,
    filters?: { status?: PurchaseRequestStatus; buyerId?: string }
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

    return await PurchaseRequest.find(query).sort({ createdAt: -1 });
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
}
