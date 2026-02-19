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
   * Find escalated disputes (for government)
   */
  async findEscalatedDisputes(): Promise<IDispute[]> {
    return await Dispute.find({
      escalatedToGovernment: true,
      deletedAt: null,
    }).sort({ createdAt: -1 });
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
