import { Dispute, IDispute } from './schema';
import { DisputeStatus } from './schema';
import mongoose from 'mongoose';

export class DisputeRepository {
  /**
   * Create a new dispute
   */
  async create(data: Partial<IDispute>): Promise<IDispute> {
    const dispute = new Dispute(data);
    return await dispute.save();
  }

  /**
   * Find dispute by ID
   */
  async findById(id: string): Promise<IDispute | null> {
    return await Dispute.findOne({ _id: id, deletedAt: null });
  }

  /**
   * Find disputes by contract ID
   */
  async findByContractId(contractId: string): Promise<IDispute[]> {
    return await Dispute.find({
      contractId: new mongoose.Types.ObjectId(contractId),
      deletedAt: null,
    }).sort({ createdAt: -1 });
  }

  /**
   * Find disputes by company ID
   */
  async findByCompanyId(
    companyId: string,
    filters?: { status?: DisputeStatus; escalated?: boolean }
  ): Promise<IDispute[]> {
    const query: Record<string, unknown> = {
      $or: [
        { companyId: new mongoose.Types.ObjectId(companyId) },
        { againstCompanyId: new mongoose.Types.ObjectId(companyId) },
      ],
      deletedAt: null,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.escalated !== undefined) {
      query.escalatedToGovernment = filters.escalated;
    }

    return await Dispute.find(query).sort({ createdAt: -1 });
  }

  /**
   * Find disputes by company ID with pagination
   */
  async findByCompanyIdPaginated(
    companyId: string,
    filters?: { status?: DisputeStatus; escalated?: boolean },
    options?: { skip?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<{ disputes: IDispute[]; total: number }> {
    const query: Record<string, unknown> = {
      $or: [
        { companyId: new mongoose.Types.ObjectId(companyId) },
        { againstCompanyId: new mongoose.Types.ObjectId(companyId) },
      ],
      deletedAt: null,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.escalated !== undefined) {
      query.escalatedToGovernment = filters.escalated;
    }

    const sort: Record<string, 1 | -1> = {};
    if (options?.sortBy) {
      sort[options.sortBy] = options.sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    const skip = options?.skip || 0;
    const limit = options?.limit || 20;

    const [disputes, total] = await Promise.all([
      Dispute.find(query).sort(sort).skip(skip).limit(limit),
      Dispute.countDocuments(query),
    ]);

    return { disputes, total };
  }

  /**
   * Find all disputes (for government)
   */
  async findAll(filters?: { status?: DisputeStatus; escalated?: boolean }): Promise<IDispute[]> {
    const query: Record<string, unknown> = {
      deletedAt: null,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.escalated !== undefined) {
      query.escalatedToGovernment = filters.escalated;
    }

    return await Dispute.find(query).sort({ createdAt: -1 });
  }

  /**
   * Find escalated disputes (for government)
   */
  async findEscalatedDisputes(): Promise<IDispute[]> {
    return await Dispute.find({
      escalatedToGovernment: true,
      deletedAt: null,
    }).sort({ createdAt: -1 });
  }

  /**
   * Find disputes assigned to a specific user
   */
  async findByAssignedTo(userId: string, filters?: { status?: DisputeStatus }): Promise<IDispute[]> {
    const query: Record<string, unknown> = {
      assignedTo: new mongoose.Types.ObjectId(userId),
      deletedAt: null,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    return await Dispute.find(query).sort({ createdAt: -1 });
  }

  /**
   * Add attachments to dispute
   */
  async addAttachments(
    id: string,
    attachments: Array<{
      type: string;
      url: string;
      uploadedAt: Date;
    }>
  ): Promise<IDispute | null> {
    return await Dispute.findByIdAndUpdate(
      id,
      {
        $push: { attachments: { $each: attachments } },
        updatedAt: new Date(),
      },
      { new: true }
    );
  }

  /**
   * Update dispute
   */
  async update(id: string, data: Partial<IDispute>): Promise<IDispute | null> {
    return await Dispute.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  /**
   * Soft delete dispute
   */
  async softDelete(id: string): Promise<void> {
    await Dispute.findByIdAndUpdate(id, { deletedAt: new Date() });
  }
}
