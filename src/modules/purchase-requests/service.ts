import { PurchaseRequestRepository } from './repository';
import {
  CreatePurchaseRequestDto,
  UpdatePurchaseRequestDto,
  PurchaseRequestResponse,
} from './types';
import { AppError } from '../../middlewares/error.middleware';
import { IPurchaseRequest, PurchaseRequestStatus } from './schema';
import { RFQService } from '../rfqs/service';

export class PurchaseRequestService {
  private repository: PurchaseRequestRepository;
  private rfqService: RFQService;

  constructor() {
    this.repository = new PurchaseRequestRepository();
    this.rfqService = new RFQService();
  }

  /**
   * Create a new purchase request
   */
  async createPurchaseRequest(
    buyerId: string,
    companyId: string,
    data: CreatePurchaseRequestDto
  ): Promise<PurchaseRequestResponse> {
    const purchaseRequest = await this.repository.create({
      buyerId,
      companyId,
      ...data,
      requiredDeliveryDate: new Date(data.requiredDeliveryDate),
      status: PurchaseRequestStatus.DRAFT,
    });

    return this.toPurchaseRequestResponse(purchaseRequest);
  }

  /**
   * Get purchase request by ID
   */
  async getPurchaseRequestById(
    id: string
  ): Promise<PurchaseRequestResponse> {
    const purchaseRequest = await this.repository.findById(id);
    if (!purchaseRequest) {
      throw new AppError('Purchase request not found', 404);
    }
    return this.toPurchaseRequestResponse(purchaseRequest);
  }

  /**
   * Get purchase requests by company
   */
  async getPurchaseRequestsByCompany(
    companyId: string,
    filters?: { status?: string; buyerId?: string }
  ): Promise<PurchaseRequestResponse[]> {
    const purchaseRequests = await this.repository.findByCompanyId(
      companyId,
      filters as any
    );
    return purchaseRequests.map((pr) =>
      this.toPurchaseRequestResponse(pr)
    );
  }

  /**
   * Update purchase request
   */
  async updatePurchaseRequest(
    id: string,
    data: UpdatePurchaseRequestDto
  ): Promise<PurchaseRequestResponse> {
    const purchaseRequest = await this.repository.findById(id);
    if (!purchaseRequest) {
      throw new AppError('Purchase request not found', 404);
    }

    const updateData: Partial<IPurchaseRequest> = { ...data };
    if (data.requiredDeliveryDate) {
      updateData.requiredDeliveryDate = new Date(data.requiredDeliveryDate);
    }

    const updated = await this.repository.update(id, updateData);
    if (!updated) {
      throw new AppError('Failed to update purchase request', 500);
    }

    return this.toPurchaseRequestResponse(updated);
  }

  /**
   * Approve purchase request and generate RFQs
   */
  async approvePurchaseRequest(
    id: string
  ): Promise<PurchaseRequestResponse> {
    const purchaseRequest = await this.repository.findById(id);
    if (!purchaseRequest) {
      throw new AppError('Purchase request not found', 404);
    }

    if (purchaseRequest.status !== PurchaseRequestStatus.DRAFT &&
        purchaseRequest.status !== PurchaseRequestStatus.PENDING) {
      throw new AppError('Purchase request cannot be approved in current status', 400);
    }

    // Update status
    const updated = await this.repository.update(id, {
      status: PurchaseRequestStatus.APPROVED,
    });

    if (!updated) {
      throw new AppError('Failed to approve purchase request', 500);
    }

    // Auto-generate RFQs for all provider types
    if (!purchaseRequest.rfqGenerated) {
      await this.rfqService.generateRFQsForPurchaseRequest(
        purchaseRequest._id.toString()
      );
      await this.repository.markRfqGenerated(id);
    }

    return this.toPurchaseRequestResponse(updated!);
  }

  /**
   * Delete purchase request (soft delete)
   */
  async deletePurchaseRequest(id: string): Promise<void> {
    const purchaseRequest = await this.repository.findById(id);
    if (!purchaseRequest) {
      throw new AppError('Purchase request not found', 404);
    }

    await this.repository.softDelete(id);
  }

  /**
   * Convert IPurchaseRequest to PurchaseRequestResponse
   */
  private toPurchaseRequestResponse(
    pr: IPurchaseRequest
  ): PurchaseRequestResponse {
    return {
      id: pr._id.toString(),
      buyerId: pr.buyerId.toString(),
      companyId: pr.companyId.toString(),
      title: pr.title,
      description: pr.description,
      items: pr.items,
      budget: pr.budget,
      currency: pr.currency,
      deliveryLocation: pr.deliveryLocation,
      requiredDeliveryDate: pr.requiredDeliveryDate,
      status: pr.status,
      rfqGenerated: pr.rfqGenerated,
      createdAt: pr.createdAt,
      updatedAt: pr.updatedAt,
    };
  }
}
