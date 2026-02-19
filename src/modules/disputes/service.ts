import { DisputeRepository } from './repository';
import {
  CreateDisputeDto,
  UpdateDisputeDto,
  EscalateDisputeDto,
  DisputeResponse,
} from './types';
import { AppError } from '../../middlewares/error.middleware';
import { IDispute, DisputeStatus } from './schema';
import { ContractRepository } from '../contracts/repository';
import mongoose from 'mongoose';

export class DisputeService {
  private repository: DisputeRepository;
  private contractRepository: ContractRepository;

  constructor() {
    this.repository = new DisputeRepository();
    this.contractRepository = new ContractRepository();
  }

  /**
   * Create a new dispute
   */
  async createDispute(
    companyId: string,
    userId: string,
    data: CreateDisputeDto
  ): Promise<DisputeResponse> {
    // Verify contract exists
    const contract = await this.contractRepository.findById(data.contractId);
    if (!contract) {
      throw new AppError('Contract not found', 404);
    }

    // Create dispute
    const dispute = await this.repository.create({
      ...data,
      companyId,
      raisedBy: new mongoose.Types.ObjectId(userId),
      againstCompanyId: new mongoose.Types.ObjectId(data.againstCompanyId),
      contractId: new mongoose.Types.ObjectId(data.contractId),
      attachments: data.attachments || [],
      status: DisputeStatus.OPEN,
    });

    return this.toDisputeResponse(dispute);
  }

  /**
   * Get dispute by ID
   */
  async getDisputeById(id: string): Promise<DisputeResponse> {
    const dispute = await this.repository.findById(id);
    if (!dispute) {
      throw new AppError('Dispute not found', 404);
    }
    return this.toDisputeResponse(dispute);
  }

  /**
   * Get disputes by contract
   */
  async getDisputesByContract(contractId: string): Promise<DisputeResponse[]> {
    const disputes = await this.repository.findByContractId(contractId);
    return disputes.map((dispute) => this.toDisputeResponse(dispute));
  }

  /**
   * Get disputes by company
   */
  async getDisputesByCompany(
    companyId: string,
    filters?: { status?: string; escalated?: boolean }
  ): Promise<DisputeResponse[]> {
    const disputes = await this.repository.findByCompanyId(companyId, {
      status: filters?.status as any,
      escalated: filters?.escalated,
    });
    return disputes.map((dispute) => this.toDisputeResponse(dispute));
  }

  /**
   * Get escalated disputes (for government)
   */
  async getEscalatedDisputes(): Promise<DisputeResponse[]> {
    const disputes = await this.repository.findEscalatedDisputes();
    return disputes.map((dispute) => this.toDisputeResponse(dispute));
  }

  /**
   * Update dispute
   */
  async updateDispute(id: string, data: UpdateDisputeDto): Promise<DisputeResponse> {
    const dispute = await this.repository.findById(id);
    if (!dispute) {
      throw new AppError('Dispute not found', 404);
    }

    const updated = await this.repository.update(id, data);
    if (!updated) {
      throw new AppError('Failed to update dispute', 500);
    }

    return this.toDisputeResponse(updated);
  }

  /**
   * Escalate dispute to government
   */
  async escalateDispute(
    id: string,
    data: EscalateDisputeDto
  ): Promise<DisputeResponse> {
    const dispute = await this.repository.findById(id);
    if (!dispute) {
      throw new AppError('Dispute not found', 404);
    }

    const updated = await this.repository.update(id, {
      escalatedToGovernment: true,
      status: DisputeStatus.ESCALATED,
      governmentNotes: data.governmentNotes,
    });

    if (!updated) {
      throw new AppError('Failed to escalate dispute', 500);
    }

    return this.toDisputeResponse(updated);
  }

  /**
   * Resolve dispute
   */
  async resolveDispute(
    id: string,
    resolution: string
  ): Promise<DisputeResponse> {
    const dispute = await this.repository.findById(id);
    if (!dispute) {
      throw new AppError('Dispute not found', 404);
    }

    const updated = await this.repository.update(id, {
      status: DisputeStatus.RESOLVED,
      resolution,
    });

    if (!updated) {
      throw new AppError('Failed to resolve dispute', 500);
    }

    return this.toDisputeResponse(updated);
  }

  /**
   * Delete dispute (soft delete)
   */
  async deleteDispute(id: string): Promise<void> {
    const dispute = await this.repository.findById(id);
    if (!dispute) {
      throw new AppError('Dispute not found', 404);
    }

    await this.repository.softDelete(id);
  }

  /**
   * Convert IDispute to DisputeResponse
   */
  private toDisputeResponse(dispute: IDispute): DisputeResponse {
    return {
      id: dispute._id.toString(),
      contractId: dispute.contractId.toString(),
      companyId: dispute.companyId.toString(),
      raisedBy: dispute.raisedBy.toString(),
      againstCompanyId: dispute.againstCompanyId.toString(),
      type: dispute.type,
      description: dispute.description,
      attachments: dispute.attachments,
      status: dispute.status,
      resolution: dispute.resolution,
      escalatedToGovernment: dispute.escalatedToGovernment,
      governmentNotes: dispute.governmentNotes,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
    };
  }
}
