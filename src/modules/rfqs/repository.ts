import { RFQ, IRFQ } from './schema';
import { RFQStatus, RFQType } from './schema';
import { CompanyType } from '../companies/schema';
import mongoose from 'mongoose';

export class RFQRepository {
  /**
   * Create a new RFQ
   */
  async create(data: Partial<IRFQ>): Promise<IRFQ> {
    const rfq = new RFQ(data);
    return await rfq.save();
  }

  /**
   * Find RFQ by ID
   */
  async findById(id: string): Promise<IRFQ | null> {
    return await RFQ.findOne({ _id: id, deletedAt: null });
  }

  /**
   * Find RFQs by purchase request ID
   */
  async findByPurchaseRequestId(
    purchaseRequestId: string
  ): Promise<IRFQ[]> {
    return await RFQ.find({
      purchaseRequestId: new mongoose.Types.ObjectId(purchaseRequestId),
      deletedAt: null,
    });
  }

  /**
   * Find RFQs by company ID
   */
  async findByCompanyId(
    companyId: string,
    filters?: { type?: RFQType; status?: RFQStatus }
  ): Promise<IRFQ[]> {
    const query: Record<string, unknown> = {
      companyId: new mongoose.Types.ObjectId(companyId),
      deletedAt: null,
    };

    if (filters?.type) {
      query.type = filters.type;
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    return await RFQ.find(query).sort({ createdAt: -1 });
  }

  /**
   * Find RFQs by target company type (for providers to see available RFQs)
   */
  async findByTargetCompanyType(
    targetCompanyType: CompanyType,
    filters?: { status?: RFQStatus; type?: RFQType }
  ): Promise<IRFQ[]> {
    const query: Record<string, unknown> = {
      targetCompanyType,
      deletedAt: null,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.type) {
      query.type = filters.type;
    }

    return await RFQ.find(query)
      .where('deadline').gte(new Date())
      .sort({ deadline: 1 });
  }

  /**
   * Update RFQ
   */
  async update(id: string, data: Partial<IRFQ>): Promise<IRFQ | null> {
    return await RFQ.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  /**
   * Soft delete RFQ
   */
  async softDelete(id: string): Promise<void> {
    await RFQ.findByIdAndUpdate(id, { deletedAt: new Date() });
  }

  /**
   * Close expired RFQs
   */
  async closeExpiredRFQs(): Promise<void> {
    await RFQ.updateMany(
      {
        deadline: { $lt: new Date() },
        status: RFQStatus.OPEN,
      },
      {
        status: RFQStatus.CLOSED,
        updatedAt: new Date(),
      }
    );
  }
}
