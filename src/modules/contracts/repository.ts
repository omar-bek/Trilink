import { Contract, IContract } from './schema';
import { ContractStatus } from './schema';
import mongoose from 'mongoose';

export class ContractRepository {
  /**
   * Create a new contract
   */
  async create(data: Partial<IContract>): Promise<IContract> {
    const contract = new Contract(data);
    return await contract.save();
  }

  /**
   * Find contract by ID
   */
  async findById(id: string): Promise<IContract | null> {
    return await Contract.findOne({ _id: id, deletedAt: null });
  }

  /**
   * Find contracts by purchase request ID
   */
  async findByPurchaseRequestId(
    purchaseRequestId: string
  ): Promise<IContract[]> {
    return await Contract.find({
      purchaseRequestId: new mongoose.Types.ObjectId(purchaseRequestId),
      deletedAt: null,
    });
  }

  /**
   * Find contracts by company ID
   */
  async findByCompanyId(
    companyId: string,
    filters?: { status?: ContractStatus }
  ): Promise<IContract[]> {
    const query: Record<string, unknown> = {
      $or: [
        { buyerCompanyId: new mongoose.Types.ObjectId(companyId) },
        { 'parties.companyId': new mongoose.Types.ObjectId(companyId) },
      ],
      deletedAt: null,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    return await Contract.find(query).sort({ createdAt: -1 });
  }

  /**
   * Update contract
   */
  async update(
    id: string,
    data: Partial<IContract>
  ): Promise<IContract | null> {
    return await Contract.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  /**
   * Add signature to contract
   */
  async addSignature(
    id: string,
    signature: {
      partyId: mongoose.Types.ObjectId;
      userId: mongoose.Types.ObjectId;
      signature: string;
    }
  ): Promise<IContract | null> {
    return await Contract.findByIdAndUpdate(
      id,
      {
        $push: {
          signatures: {
            ...signature,
            signedAt: new Date(),
          },
        },
        updatedAt: new Date(),
      },
      { new: true }
    );
  }

  /**
   * Update payment milestone status
   */
  async updatePaymentMilestone(
    contractId: string,
    milestone: string,
    status: string
  ): Promise<void> {
    await Contract.updateOne(
      {
        _id: contractId,
        'paymentSchedule.milestone': milestone,
      },
      {
        $set: {
          'paymentSchedule.$.status': status,
        },
        updatedAt: new Date(),
      }
    );
  }

  /**
   * Soft delete contract
   */
  async softDelete(id: string): Promise<void> {
    await Contract.findByIdAndUpdate(id, { deletedAt: new Date() });
  }
}
