import {
  ContractAmendment,
  IContractAmendment,
  AmendmentStatus,
} from './amendment.schema';
import mongoose from 'mongoose';

export class ContractAmendmentRepository {
  /**
   * Create a new amendment
   */
  async create(data: Partial<IContractAmendment>): Promise<IContractAmendment> {
    const amendment = new ContractAmendment(data);
    return await amendment.save();
  }

  /**
   * Find amendment by ID
   */
  async findById(id: string): Promise<IContractAmendment | null> {
    return await ContractAmendment.findById(id);
  }

  /**
   * Find amendments by contract ID
   */
  async findByContractId(
    contractId: string,
    filters?: { status?: AmendmentStatus }
  ): Promise<IContractAmendment[]> {
    const query: Record<string, unknown> = {
      contractId: new mongoose.Types.ObjectId(contractId),
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    return await ContractAmendment.find(query)
      .sort({ version: -1 })
      .populate('createdBy.userId', 'email firstName lastName')
      .populate('approvals.userId', 'email firstName lastName');
  }

  /**
   * Get latest version number for a contract
   */
  async getLatestVersion(contractId: string): Promise<number> {
    const latest = await ContractAmendment.findOne({
      contractId: new mongoose.Types.ObjectId(contractId),
    })
      .sort({ version: -1 })
      .select('version')
      .lean();

    return latest?.version || 0;
  }

  /**
   * Generate unique amendment number
   */
  async generateAmendmentNumber(): Promise<string> {
    const count = await ContractAmendment.countDocuments();
    const number = String(count + 1).padStart(6, '0');
    return `AMEND-${number}`;
  }

  /**
   * Add approval to amendment
   */
  async addApproval(
    amendmentId: string,
    approval: {
      partyId: mongoose.Types.ObjectId;
      userId: mongoose.Types.ObjectId;
      approved: boolean;
      comments?: string;
    }
  ): Promise<IContractAmendment | null> {
    return await ContractAmendment.findByIdAndUpdate(
      amendmentId,
      {
        $push: {
          approvals: {
            ...approval,
            approvedAt: new Date(),
          },
        },
        updatedAt: new Date(),
      },
      { new: true }
    );
  }

  /**
   * Update amendment status
   */
  async updateStatus(
    amendmentId: string,
    status: AmendmentStatus
  ): Promise<IContractAmendment | null> {
    return await ContractAmendment.findByIdAndUpdate(
      amendmentId,
      {
        status,
        updatedAt: new Date(),
      },
      { new: true }
    );
  }

  /**
   * Mark amendment as applied
   */
  async markAsApplied(
    amendmentId: string,
    appliedBy: mongoose.Types.ObjectId
  ): Promise<IContractAmendment | null> {
    return await ContractAmendment.findByIdAndUpdate(
      amendmentId,
      {
        status: AmendmentStatus.ACTIVE,
        appliedAt: new Date(),
        appliedBy,
        updatedAt: new Date(),
      },
      { new: true }
    );
  }

  /**
   * Find pending amendments for a contract
   */
  async findPendingAmendments(
    contractId: string
  ): Promise<IContractAmendment[]> {
    return await ContractAmendment.find({
      contractId: new mongoose.Types.ObjectId(contractId),
      status: AmendmentStatus.PENDING_APPROVAL,
    }).sort({ createdAt: -1 });
  }

  /**
   * Check if party has already approved/rejected
   */
  async hasPartyResponded(
    amendmentId: string,
    partyId: string
  ): Promise<boolean> {
    const amendment = await ContractAmendment.findById(amendmentId);
    if (!amendment) {
      return false;
    }

    return amendment.approvals.some(
      (approval) => approval.partyId.toString() === partyId
    );
  }
}
