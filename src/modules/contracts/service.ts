import { ContractRepository } from './repository';
import {
  CreateContractDto,
  SignContractDto,
  UpdateContractDto,
  ContractResponse,
} from './types';
import { AppError } from '../../middlewares/error.middleware';
import { IContract, ContractStatus } from './schema';
import { PurchaseRequestRepository } from '../purchase-requests/repository';
import { BidRepository } from '../bids/repository';
import mongoose from 'mongoose';

export class ContractService {
  private repository: ContractRepository;
  private purchaseRequestRepository: PurchaseRequestRepository;
  private bidRepository: BidRepository;

  constructor() {
    this.repository = new ContractRepository();
    this.purchaseRequestRepository = new PurchaseRequestRepository();
    this.bidRepository = new BidRepository();
  }

  /**
   * Create a new contract from accepted bids
   */
  async createContract(
    buyerCompanyId: string,
    data: CreateContractDto
  ): Promise<ContractResponse> {
    // Verify purchase request exists
    const purchaseRequest = await this.purchaseRequestRepository.findById(
      data.purchaseRequestId
    );
    if (!purchaseRequest) {
      throw new AppError('Purchase request not found', 404);
    }

    // Verify all bids are accepted
    for (const party of data.parties) {
      if (party.bidId) {
        const bid = await this.bidRepository.findById(party.bidId);
        if (!bid || bid.status !== 'accepted') {
          throw new AppError(`Bid ${party.bidId} is not accepted`, 400);
        }
      }
    }

    // Create contract
    const contract = await this.repository.create({
      ...data,
      buyerCompanyId,
      parties: data.parties.map((p) => ({
        ...p,
        companyId: new mongoose.Types.ObjectId(p.companyId),
        userId: new mongoose.Types.ObjectId(p.userId),
        bidId: p.bidId ? new mongoose.Types.ObjectId(p.bidId) : undefined,
      })),
      amounts: {
        ...data.amounts,
        breakdown: data.amounts.breakdown.map((b) => ({
          ...b,
          partyId: new mongoose.Types.ObjectId(b.partyId),
        })),
      },
      paymentSchedule: data.paymentSchedule.map((ps) => ({
        ...ps,
        dueDate: new Date(ps.dueDate),
      })),
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      status: ContractStatus.PENDING_SIGNATURE,
    });

    return this.toContractResponse(contract);
  }

  /**
   * Get contract by ID
   */
  async getContractById(id: string): Promise<ContractResponse> {
    const contract = await this.repository.findById(id);
    if (!contract) {
      throw new AppError('Contract not found', 404);
    }
    return this.toContractResponse(contract);
  }

  /**
   * Get contracts by company
   */
  async getContractsByCompany(
    companyId: string,
    filters?: { status?: string }
  ): Promise<ContractResponse[]> {
    const contracts = await this.repository.findByCompanyId(companyId, filters as any);
    return contracts.map((contract) => this.toContractResponse(contract));
  }

  /**
   * Get contracts by purchase request
   */
  async getContractsByPurchaseRequest(
    purchaseRequestId: string
  ): Promise<ContractResponse[]> {
    const contracts = await this.repository.findByPurchaseRequestId(
      purchaseRequestId
    );
    return contracts.map((contract) => this.toContractResponse(contract));
  }

  /**
   * Sign contract
   */
  async signContract(
    contractId: string,
    userId: string,
    companyId: string,
    data: SignContractDto
  ): Promise<ContractResponse> {
    const contract = await this.repository.findById(contractId);
    if (!contract) {
      throw new AppError('Contract not found', 404);
    }

    // Verify user is a party to the contract
    const party = contract.parties.find(
      (p) =>
        p.companyId.toString() === companyId &&
        p.userId.toString() === userId
    );

    if (!party) {
      throw new AppError('User is not a party to this contract', 403);
    }

    // Check if already signed
    const existingSignature = contract.signatures.find(
      (s) => s.partyId.toString() === party.companyId.toString()
    );

    if (existingSignature) {
      throw new AppError('Contract already signed by this party', 400);
    }

    // Add signature
    const updated = await this.repository.addSignature(contractId, {
      partyId: party.companyId,
      userId: new mongoose.Types.ObjectId(userId),
      signature: data.signature,
    });

    if (!updated) {
      throw new AppError('Failed to sign contract', 500);
    }

    // Check if all parties have signed
    if (updated.signatures.length === updated.parties.length) {
      await this.repository.update(contractId, {
        status: ContractStatus.SIGNED,
      });
      const finalContract = await this.repository.findById(contractId);
      return this.toContractResponse(finalContract!);
    }

    return this.toContractResponse(updated);
  }

  /**
   * Update contract
   */
  async updateContract(
    id: string,
    data: UpdateContractDto
  ): Promise<ContractResponse> {
    const contract = await this.repository.findById(id);
    if (!contract) {
      throw new AppError('Contract not found', 404);
    }

    const updateData: Partial<IContract> = { ...data };
    if (data.paymentSchedule) {
      updateData.paymentSchedule = data.paymentSchedule.map((ps) => ({
        ...ps,
        dueDate: new Date(ps.dueDate),
      }));
    }

    const updated = await this.repository.update(id, updateData);
    if (!updated) {
      throw new AppError('Failed to update contract', 500);
    }

    return this.toContractResponse(updated);
  }

  /**
   * Activate contract (after all signatures)
   */
  async activateContract(id: string): Promise<ContractResponse> {
    const contract = await this.repository.findById(id);
    if (!contract) {
      throw new AppError('Contract not found', 404);
    }

    if (contract.status !== ContractStatus.SIGNED) {
      throw new AppError('Contract must be signed before activation', 400);
    }

    const updated = await this.repository.update(id, {
      status: ContractStatus.ACTIVE,
    });

    if (!updated) {
      throw new AppError('Failed to activate contract', 500);
    }

    return this.toContractResponse(updated);
  }

  /**
   * Delete contract (soft delete)
   */
  async deleteContract(id: string): Promise<void> {
    const contract = await this.repository.findById(id);
    if (!contract) {
      throw new AppError('Contract not found', 404);
    }

    await this.repository.softDelete(id);
  }

  /**
   * Convert IContract to ContractResponse
   */
  private toContractResponse(contract: IContract): ContractResponse {
    return {
      id: contract._id.toString(),
      purchaseRequestId: contract.purchaseRequestId.toString(),
      buyerCompanyId: contract.buyerCompanyId.toString(),
      parties: contract.parties.map((p) => ({
        companyId: p.companyId.toString(),
        userId: p.userId.toString(),
        role: p.role,
        bidId: p.bidId?.toString(),
      })),
      amounts: {
        ...contract.amounts,
        breakdown: contract.amounts.breakdown.map((b) => ({
          partyId: b.partyId.toString(),
          amount: b.amount,
          description: b.description,
        })),
      },
      paymentSchedule: contract.paymentSchedule,
      signatures: contract.signatures.map((s) => ({
        partyId: s.partyId.toString(),
        userId: s.userId.toString(),
        signedAt: s.signedAt,
        signature: s.signature,
      })),
      terms: contract.terms,
      startDate: contract.startDate,
      endDate: contract.endDate,
      status: contract.status,
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt,
    };
  }
}
