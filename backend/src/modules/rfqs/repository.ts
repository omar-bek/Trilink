import { RFQ, IRFQ } from './schema';
import { RFQStatus, RFQType } from './schema';
import { CompanyType } from '../companies/schema';
import { Role } from '../../config/rbac';
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
   * Find RFQs by company ID with pagination
   */
  async findByCompanyIdPaginated(
    companyId: string,
    filters?: { type?: RFQType; status?: RFQStatus },
    options?: { skip?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<{ rfqs: IRFQ[]; total: number }> {
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

    const sort: Record<string, 1 | -1> = {};
    if (options?.sortBy) {
      sort[options.sortBy] = options.sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    const skip = options?.skip || 0;
    const limit = options?.limit || 20;

    const [rfqs, total] = await Promise.all([
      RFQ.find(query).sort(sort).skip(skip).limit(limit),
      RFQ.countDocuments(query),
    ]);

    return { rfqs, total };
  }

  /**
   * Find RFQs by target company type (for providers to see available RFQs)
   * Also includes RFQs where the company is in targetCompanyIds
   */
  async findByTargetCompanyType(
    targetCompanyType: CompanyType,
    filters?: { status?: RFQStatus; type?: RFQType },
    companyId?: string
  ): Promise<IRFQ[]> {
    const query: Record<string, unknown> = {
      deletedAt: null,
    };

    // Include RFQs that match the target company type
    // OR RFQs where this company is specifically targeted
    if (companyId) {
      query.$or = [
        { targetCompanyType },
        { targetCompanyIds: new mongoose.Types.ObjectId(companyId) },
      ];
    } else {
      query.targetCompanyType = targetCompanyType;
    }

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
   * Find RFQs by target role (for providers to see available RFQs)
   * Also includes RFQs where the company is in targetCompanyIds
   */
  async findByTargetRole(
    targetRole: Role,
    filters?: { status?: RFQStatus; type?: RFQType },
    companyId?: string
  ): Promise<IRFQ[]> {
    const query: Record<string, unknown> = {
      deletedAt: null,
    };

    // Include RFQs that match the target role
    // OR RFQs where this company is specifically targeted
    if (companyId) {
      query.$or = [
        { targetRole },
        { targetCompanyIds: new mongoose.Types.ObjectId(companyId) },
      ];
    } else {
      query.targetRole = targetRole;
    }

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
   * Find RFQs by target role with pagination
   * Also includes RFQs where the company is in targetCompanyIds
   */
  async findByTargetRolePaginated(
    targetRole: Role,
    filters?: { status?: RFQStatus; type?: RFQType },
    options?: { skip?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc'; companyId?: string }
  ): Promise<{ rfqs: IRFQ[]; total: number }> {
    const query: Record<string, unknown> = {
      deletedAt: null,
      deadline: { $gte: new Date() },
    };

    // Include RFQs that match the target role
    // OR RFQs where this company is specifically targeted
    if (options?.companyId) {
      query.$or = [
        { targetRole },
        { targetCompanyIds: new mongoose.Types.ObjectId(options.companyId) },
      ];
    } else {
      query.targetRole = targetRole;
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.type) {
      query.type = filters.type;
    }

    const sort: Record<string, 1 | -1> = {};
    if (options?.sortBy) {
      sort[options.sortBy] = options.sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.deadline = 1;
    }

    const skip = options?.skip || 0;
    const limit = options?.limit || 20;

    const [rfqs, total] = await Promise.all([
      RFQ.find(query).sort(sort).skip(skip).limit(limit),
      RFQ.countDocuments(query),
    ]);

    return { rfqs, total };
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

  /**
   * Find all RFQs (for analytics)
   */
  async findAll(filters?: { status?: RFQStatus; type?: RFQType }): Promise<IRFQ[]> {
    const query: Record<string, unknown> = {
      deletedAt: null,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.type) {
      query.type = filters.type;
    }

    return await RFQ.find(query).sort({ createdAt: -1 });
  }
}
