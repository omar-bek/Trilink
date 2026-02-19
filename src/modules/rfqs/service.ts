import { RFQRepository } from './repository';
import { CreateRFQDto, UpdateRFQDto, RFQResponse } from './types';
import { AppError } from '../../middlewares/error.middleware';
import { IRFQ, RFQType, RFQStatus } from './schema';
import { PurchaseRequestRepository } from '../purchase-requests/repository';
import { CompanyType } from '../companies/schema';

export class RFQService {
  private repository: RFQRepository;
  private purchaseRequestRepository: PurchaseRequestRepository;

  constructor() {
    this.repository = new RFQRepository();
    this.purchaseRequestRepository = new PurchaseRequestRepository();
  }

  /**
   * Create a new RFQ
   */
  async createRFQ(
    companyId: string,
    data: CreateRFQDto
  ): Promise<RFQResponse> {
    // Verify purchase request exists
    const purchaseRequest = await this.purchaseRequestRepository.findById(
      data.purchaseRequestId
    );
    if (!purchaseRequest) {
      throw new AppError('Purchase request not found', 404);
    }

    const rfq = await this.repository.create({
      ...data,
      companyId,
      requiredDeliveryDate: new Date(data.requiredDeliveryDate),
      deadline: new Date(data.deadline),
    });

    return this.toRFQResponse(rfq);
  }

  /**
   * Auto-generate RFQs for a purchase request
   * Creates RFQs for Supplier, Logistics, Clearance, and Service Provider
   */
  async generateRFQsForPurchaseRequest(
    purchaseRequestId: string
  ): Promise<RFQResponse[]> {
    const purchaseRequest = await this.purchaseRequestRepository.findById(
      purchaseRequestId
    );
    if (!purchaseRequest) {
      throw new AppError('Purchase request not found', 404);
    }

    const rfqs: RFQResponse[] = [];
    const rfqTypes = [
      { type: RFQType.SUPPLIER, targetType: CompanyType.SUPPLIER },
      { type: RFQType.LOGISTICS, targetType: CompanyType.LOGISTICS },
      { type: RFQType.CLEARANCE, targetType: CompanyType.CLEARANCE },
      { type: RFQType.SERVICE_PROVIDER, targetType: CompanyType.SERVICE_PROVIDER },
    ];

    // Calculate deadline (7 days from now)
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    for (const { type, targetType } of rfqTypes) {
      const rfq = await this.repository.create({
        purchaseRequestId: purchaseRequest._id,
        companyId: purchaseRequest.companyId,
        type,
        targetCompanyType: targetType,
        title: `${purchaseRequest.title} - ${type} RFQ`,
        description: purchaseRequest.description,
        items: purchaseRequest.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          specifications: item.specifications,
        })),
        budget: purchaseRequest.budget,
        currency: purchaseRequest.currency,
        deliveryLocation: purchaseRequest.deliveryLocation,
        requiredDeliveryDate: purchaseRequest.requiredDeliveryDate,
        deadline,
        status: RFQStatus.OPEN,
        isAnonymous: false,
      });

      rfqs.push(this.toRFQResponse(rfq));
    }

    return rfqs;
  }

  /**
   * Get RFQ by ID
   */
  async getRFQById(id: string): Promise<RFQResponse> {
    const rfq = await this.repository.findById(id);
    if (!rfq) {
      throw new AppError('RFQ not found', 404);
    }
    return this.toRFQResponse(rfq);
  }

  /**
   * Get RFQs by purchase request
   */
  async getRFQsByPurchaseRequest(
    purchaseRequestId: string
  ): Promise<RFQResponse[]> {
    const rfqs = await this.repository.findByPurchaseRequestId(
      purchaseRequestId
    );
    return rfqs.map((rfq) => this.toRFQResponse(rfq));
  }

  /**
   * Get RFQs by company
   */
  async getRFQsByCompany(
    companyId: string,
    filters?: { type?: string; status?: string }
  ): Promise<RFQResponse[]> {
    const rfqs = await this.repository.findByCompanyId(companyId, filters as any);
    return rfqs.map((rfq) => this.toRFQResponse(rfq));
  }

  /**
   * Get available RFQs for a company type (for providers)
   */
  async getAvailableRFQs(
    targetCompanyType: CompanyType,
    filters?: { status?: string; type?: string }
  ): Promise<RFQResponse[]> {
    const rfqs = await this.repository.findByTargetCompanyType(
      targetCompanyType,
      filters as any
    );
    return rfqs.map((rfq) => this.toRFQResponse(rfq));
  }

  /**
   * Update RFQ
   */
  async updateRFQ(id: string, data: UpdateRFQDto): Promise<RFQResponse> {
    const rfq = await this.repository.findById(id);
    if (!rfq) {
      throw new AppError('RFQ not found', 404);
    }

    const updateData: Partial<IRFQ> = { ...data };
    if (data.deadline) {
      updateData.deadline = new Date(data.deadline);
    }

    const updated = await this.repository.update(id, updateData);
    if (!updated) {
      throw new AppError('Failed to update RFQ', 500);
    }

    return this.toRFQResponse(updated);
  }

  /**
   * Delete RFQ (soft delete)
   */
  async deleteRFQ(id: string): Promise<void> {
    const rfq = await this.repository.findById(id);
    if (!rfq) {
      throw new AppError('RFQ not found', 404);
    }

    await this.repository.softDelete(id);
  }

  /**
   * Convert IRFQ to RFQResponse
   */
  private toRFQResponse(rfq: IRFQ): RFQResponse {
    return {
      id: rfq._id.toString(),
      purchaseRequestId: rfq.purchaseRequestId.toString(),
      companyId: rfq.companyId.toString(),
      type: rfq.type,
      targetCompanyType: rfq.targetCompanyType,
      title: rfq.title,
      description: rfq.description,
      items: rfq.items,
      budget: rfq.budget,
      currency: rfq.currency,
      deliveryLocation: rfq.deliveryLocation,
      requiredDeliveryDate: rfq.requiredDeliveryDate,
      deadline: rfq.deadline,
      status: rfq.status,
      isAnonymous: rfq.isAnonymous,
      createdAt: rfq.createdAt,
      updatedAt: rfq.updatedAt,
    };
  }
}
