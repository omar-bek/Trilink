import { ShipmentRepository } from './repository';
import {
  CreateShipmentDto,
  UpdateShipmentStatusDto,
  UpdateGPSLocationDto,
  InspectShipmentDto,
  ShipmentResponse,
  SubmitCustomsDocumentsDto,
  UpdateCustomsClearanceStatusDto,
  ResubmitCustomsDocumentsDto,
} from './types';
import { AppError } from '../../middlewares/error.middleware';
import { IShipment, ShipmentStatus, InspectionStatus, CustomsClearanceStatus } from './schema';
import { ContractRepository } from '../contracts/repository';
import { PaymentRepository } from '../payments/repository';
import { PaymentStatus } from '../payments/schema';
import { Role } from '../../config/rbac';
import mongoose from 'mongoose';
import { PaginatedResponse } from '../../types/common';
import { parsePaginationQuery, createPaginationResult, buildSortObject } from '../../utils/pagination';

export class ShipmentService {
  private repository: ShipmentRepository;
  private contractRepository: ContractRepository;
  private paymentRepository: PaymentRepository;

  constructor() {
    this.repository = new ShipmentRepository();
    this.contractRepository = new ContractRepository();
    this.paymentRepository = new PaymentRepository();
  }

  /**
   * Create a new shipment
   */
  async createShipment(
    companyId: string,
    data: CreateShipmentDto
  ): Promise<ShipmentResponse> {
    // Verify contract exists
    const contract = await this.contractRepository.findById(data.contractId);
    if (!contract) {
      throw new AppError('Contract not found', 404);
    }

    // Create shipment
    const shipment = await this.repository.create({
      ...data,
      companyId: new mongoose.Types.ObjectId(companyId),
      contractId: new mongoose.Types.ObjectId(data.contractId),
      logisticsCompanyId: new mongoose.Types.ObjectId(data.logisticsCompanyId),
      estimatedDeliveryDate: new Date(data.estimatedDeliveryDate),
      status: ShipmentStatus.IN_PRODUCTION, // Start with in_production
    });

    return this.toShipmentResponse(shipment);
  }

  /**
   * Get shipment by ID
   */
  async getShipmentById(id: string): Promise<ShipmentResponse> {
    const shipment = await this.repository.findById(id);
    if (!shipment) {
      throw new AppError('Shipment not found', 404);
    }
    return this.toShipmentResponse(shipment);
  }

  /**
   * Get shipments by company
   */
  async getShipmentsByCompany(
    companyId: string,
    filters?: { status?: string }
  ): Promise<ShipmentResponse[]> {
    const shipments = await this.repository.findByCompanyId(companyId, filters as any);
    return shipments.map((shipment) => this.toShipmentResponse(shipment));
  }

  /**
   * Get shipments by company with pagination
   */
  async getShipmentsByCompanyPaginated(
    companyId: string,
    filters?: { status?: string },
    paginationQuery?: { page?: string; limit?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<PaginatedResponse<ShipmentResponse>> {
    const pagination = parsePaginationQuery(paginationQuery || {});
    const sort = buildSortObject(pagination.sortBy || 'createdAt', pagination.sortOrder);

    const { shipments, total } = await this.repository.findByCompanyIdPaginated(
      companyId,
      filters as any,
      {
        skip: pagination.skip,
        limit: pagination.limit,
        sortBy: Object.keys(sort)[0],
        sortOrder: Object.values(sort)[0] === 1 ? 'asc' : 'desc',
      }
    );

    return createPaginationResult(
      shipments.map((shipment) => this.toShipmentResponse(shipment)),
      total,
      pagination
    );
  }

  /**
   * Get shipments by contract
   */
  async getShipmentsByContract(
    contractId: string
  ): Promise<ShipmentResponse[]> {
    const shipments = await this.repository.findByContractId(contractId);
    return shipments.map((shipment) => this.toShipmentResponse(shipment));
  }

  /**
   * Update shipment status
   * Status lifecycle: in_production → ready_for_pickup → in_transit → in_clearance → delivered
   */
  async updateShipmentStatus(
    id: string,
    userId: string,
    data: UpdateShipmentStatusDto
  ): Promise<ShipmentResponse> {
    const shipment = await this.repository.findById(id);
    if (!shipment) {
      throw new AppError('Shipment not found', 404);
    }

    // Status lifecycle validation
    const validTransitions: Record<ShipmentStatus, ShipmentStatus[]> = {
      [ShipmentStatus.IN_PRODUCTION]: [ShipmentStatus.READY_FOR_PICKUP, ShipmentStatus.CANCELLED],
      [ShipmentStatus.READY_FOR_PICKUP]: [ShipmentStatus.IN_TRANSIT, ShipmentStatus.CANCELLED],
      [ShipmentStatus.IN_TRANSIT]: [ShipmentStatus.IN_CLEARANCE, ShipmentStatus.DELIVERED, ShipmentStatus.CANCELLED],
      [ShipmentStatus.IN_CLEARANCE]: [ShipmentStatus.IN_TRANSIT, ShipmentStatus.DELIVERED, ShipmentStatus.CANCELLED],
      [ShipmentStatus.DELIVERED]: [], // Final state, no transitions
      [ShipmentStatus.CANCELLED]: [], // Final state, no transitions
    };

    const allowedTransitions = validTransitions[shipment.status];
    if (!allowedTransitions.includes(data.status)) {
      throw new AppError(
        `Invalid status transition: Cannot change from ${shipment.status} to ${data.status}. Valid transitions: ${allowedTransitions.join(', ')}`,
        400
      );
    }

    // Add tracking event
    const updated = await this.repository.addTrackingEvent(id, {
      status: data.status,
      location: data.location,
      description: data.description,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!updated) {
      throw new AppError('Failed to update shipment status', 500);
    }

    // Update actual delivery date if delivered
    if (data.status === ShipmentStatus.DELIVERED && !updated.actualDeliveryDate) {
      await this.repository.update(id, {
        actualDeliveryDate: new Date(),
      });
      const finalShipment = await this.repository.findById(id);
      return this.toShipmentResponse(finalShipment!);
    }

    return this.toShipmentResponse(updated);
  }

  /**
   * Update GPS location (for real-time tracking)
   * Only Logistics role can update GPS
   */
  async updateGPSLocation(
    id: string,
    userId: string,
    data: UpdateGPSLocationDto,
    requesterRole?: Role,
    requesterCompanyId?: string
  ): Promise<ShipmentResponse> {
    const shipment = await this.repository.findById(id);
    if (!shipment) {
      throw new AppError('Shipment not found', 404);
    }

    // Only Logistics can update GPS
    if (requesterRole && requesterRole !== Role.LOGISTICS && requesterRole !== Role.ADMIN) {
      throw new AppError('Only Logistics role can update GPS location', 403);
    }

    // Verify shipment belongs to logistics company
    if (
      requesterCompanyId &&
      shipment.logisticsCompanyId.toString() !== requesterCompanyId &&
      requesterRole !== Role.ADMIN
    ) {
      throw new AppError('Access denied: Shipment does not belong to your logistics company', 403);
    }

    // Update GPS location
    const updated = await this.repository.updateGPSLocation(id, data);
    if (!updated) {
      throw new AppError('Failed to update GPS location', 500);
    }

    // Add tracking event for GPS update (if shipment is in transit or in clearance)
    if (
      updated.status === ShipmentStatus.IN_TRANSIT ||
      updated.status === ShipmentStatus.IN_CLEARANCE
    ) {
      await this.repository.addTrackingEvent(id, {
        status: updated.status,
        location: {
          address: data.address,
          coordinates: data.coordinates,
        },
        description: `GPS location updated: ${data.address}`,
        userId: new mongoose.Types.ObjectId(userId),
      });
      const finalShipment = await this.repository.findById(id);
      return this.toShipmentResponse(finalShipment!);
    }

    return this.toShipmentResponse(updated);
  }

  /**
   * Inspect shipment (Buyer only)
   * Updates inspection status and links approval to payment milestone release
   */
  async inspectShipment(
    id: string,
    buyerId: string,
    buyerCompanyId: string,
    data: InspectShipmentDto
  ): Promise<ShipmentResponse> {
    const shipment = await this.repository.findById(id);
    if (!shipment) {
      throw new AppError('Shipment not found', 404);
    }

    // Verify shipment belongs to buyer company
    if (shipment.companyId.toString() !== buyerCompanyId) {
      throw new AppError('Access denied: Shipment does not belong to your company', 403);
    }

    // Verify shipment is delivered (can only inspect delivered shipments)
    if (shipment.status !== ShipmentStatus.DELIVERED) {
      throw new AppError(
        `Shipment must be delivered before inspection. Current status: ${shipment.status}`,
        400
      );
    }

    // Update inspection status
    const updateData: Partial<IShipment> = {
      inspectionStatus: data.status,
      inspectedAt: new Date(),
      inspectedBy: new mongoose.Types.ObjectId(buyerId),
    };

    if (data.status === InspectionStatus.REJECTED) {
      if (!data.rejectionReason) {
        throw new AppError('Rejection reason is required when rejecting inspection', 400);
      }
      updateData.inspectionRejectionReason = data.rejectionReason;
    } else {
      updateData.inspectionRejectionReason = undefined;
    }

    const updated = await this.repository.update(id, updateData);
    if (!updated) {
      throw new AppError('Failed to update inspection status', 500);
    }

    // If inspection is approved, approve the "Delivery Payment" milestone payment
    if (data.status === InspectionStatus.APPROVED) {
      try {
        const contractId = shipment.contractId.toString();
        const payments = await this.paymentRepository.findByContractId(contractId);

        // Find "Delivery Payment" milestone payments for this contract
        const deliveryPayments = payments.filter(
          (payment) =>
            payment.milestone === 'Delivery Payment' &&
            payment.status === PaymentStatus.PENDING_APPROVAL
        );

        // Approve all delivery payments
        for (const payment of deliveryPayments) {
          await this.paymentRepository.update(payment._id.toString(), {
            status: PaymentStatus.APPROVED,
            approvedAt: new Date(),
            approvedBy: new mongoose.Types.ObjectId(buyerId),
            notes: `Approved automatically upon shipment inspection approval`,
          });
        }
      } catch (error) {
        // Log error but don't fail the inspection update
        console.error('Error approving delivery payment milestone:', error);
      }
    }

    return this.toShipmentResponse(updated);
  }

  /**
   * Submit customs documents for clearance
   */
  async submitCustomsDocuments(
    id: string,
    userId: string,
    companyId: string,
    data: SubmitCustomsDocumentsDto
  ): Promise<ShipmentResponse> {
    const shipment = await this.repository.findById(id);
    if (!shipment) {
      throw new AppError('Shipment not found', 404);
    }

    // Verify shipment belongs to company
    if (shipment.companyId.toString() !== companyId && shipment.logisticsCompanyId.toString() !== companyId) {
      throw new AppError('Access denied: Shipment does not belong to your company', 403);
    }

    // Verify shipment is in clearance status
    if (shipment.status !== ShipmentStatus.IN_CLEARANCE) {
      throw new AppError('Shipment must be in clearance status to submit documents', 400);
    }

    // Validate document arrays match
    if (data.documentIds.length !== data.documentTypes.length) {
      throw new AppError('Document IDs and types arrays must have the same length', 400);
    }

    // Create customs documents array
    const customsDocuments = data.documentIds.map((uploadId, index) => ({
      uploadId: new mongoose.Types.ObjectId(uploadId),
      documentType: data.documentTypes[index],
      fileName: `document_${index + 1}`, // Will be updated from upload record
      uploadedAt: new Date(),
      uploadedBy: new mongoose.Types.ObjectId(userId),
    }));

    // Add customs clearance event
    const clearanceEvent = {
      status: CustomsClearanceStatus.DOCUMENTS_SUBMITTED,
      description: `Customs documents submitted: ${data.documentTypes.join(', ')}`,
      timestamp: new Date(),
      userId: new mongoose.Types.ObjectId(userId),
    };

    const updateData: Partial<IShipment> = {
      customsClearanceStatus: CustomsClearanceStatus.DOCUMENTS_SUBMITTED,
      customsDocuments: customsDocuments,
      customsClearanceEvents: [...(shipment.customsClearanceEvents || []), clearanceEvent],
    };

    const updated = await this.repository.update(id, updateData);
    if (!updated) {
      throw new AppError('Failed to submit customs documents', 500);
    }

    // Add tracking event
    await this.repository.addTrackingEvent(id, {
      status: ShipmentStatus.IN_CLEARANCE,
      description: `Customs documents submitted for review`,
      userId: new mongoose.Types.ObjectId(userId),
    });

    const finalShipment = await this.repository.findById(id);
    return this.toShipmentResponse(finalShipment!);
  }

  /**
   * Update customs clearance status (Government/Admin only)
   */
  async updateCustomsClearanceStatus(
    id: string,
    userId: string,
    data: UpdateCustomsClearanceStatusDto
  ): Promise<ShipmentResponse> {
    const shipment = await this.repository.findById(id);
    if (!shipment) {
      throw new AppError('Shipment not found', 404);
    }

    // Verify shipment is in clearance
    if (shipment.status !== ShipmentStatus.IN_CLEARANCE) {
      throw new AppError('Shipment must be in clearance status', 400);
    }

    // Add customs clearance event
    const clearanceEvent = {
      status: data.status,
      description: data.description,
      timestamp: new Date(),
      userId: new mongoose.Types.ObjectId(userId),
      rejectionReason: data.rejectionReason,
      customsAuthority: data.customsAuthority,
    };

    const updateData: Partial<IShipment> = {
      customsClearanceStatus: data.status,
      customsClearanceEvents: [...(shipment.customsClearanceEvents || []), clearanceEvent],
    };

    if (data.status === CustomsClearanceStatus.REJECTED) {
      if (!data.rejectionReason) {
        throw new AppError('Rejection reason is required when rejecting clearance', 400);
      }
      updateData.customsRejectionReason = data.rejectionReason;
    } else if (data.status === CustomsClearanceStatus.APPROVED) {
      updateData.customsClearedAt = new Date();
      updateData.customsClearedBy = new mongoose.Types.ObjectId(userId);
      updateData.customsRejectionReason = undefined;
    } else {
      updateData.customsRejectionReason = undefined;
    }

    if (data.customsAuthority) {
      updateData.customsAuthority = data.customsAuthority;
    }

    const updated = await this.repository.update(id, updateData);
    if (!updated) {
      throw new AppError('Failed to update customs clearance status', 500);
    }

    // Add tracking event
    await this.repository.addTrackingEvent(id, {
      status: ShipmentStatus.IN_CLEARANCE,
      description: data.description,
      userId: new mongoose.Types.ObjectId(userId),
    });

    const finalShipment = await this.repository.findById(id);
    return this.toShipmentResponse(finalShipment!);
  }

  /**
   * Resubmit customs documents after rejection
   */
  async resubmitCustomsDocuments(
    id: string,
    userId: string,
    companyId: string,
    data: ResubmitCustomsDocumentsDto
  ): Promise<ShipmentResponse> {
    const shipment = await this.repository.findById(id);
    if (!shipment) {
      throw new AppError('Shipment not found', 404);
    }

    // Verify shipment belongs to company
    if (shipment.companyId.toString() !== companyId && shipment.logisticsCompanyId.toString() !== companyId) {
      throw new AppError('Access denied: Shipment does not belong to your company', 403);
    }

    // Verify shipment is in clearance and was rejected
    if (shipment.status !== ShipmentStatus.IN_CLEARANCE) {
      throw new AppError('Shipment must be in clearance status to resubmit documents', 400);
    }

    if (shipment.customsClearanceStatus !== CustomsClearanceStatus.REJECTED) {
      throw new AppError('Shipment must be in rejected status to resubmit documents', 400);
    }

    // Validate document arrays match
    if (data.documentIds.length !== data.documentTypes.length) {
      throw new AppError('Document IDs and types arrays must have the same length', 400);
    }

    // Create customs documents array
    const customsDocuments = data.documentIds.map((uploadId, index) => ({
      uploadId: new mongoose.Types.ObjectId(uploadId),
      documentType: data.documentTypes[index],
      fileName: `document_${index + 1}`,
      uploadedAt: new Date(),
      uploadedBy: new mongoose.Types.ObjectId(userId),
    }));

    // Add customs clearance event
    const clearanceEvent = {
      status: CustomsClearanceStatus.RESUBMITTED,
      description: `Customs documents resubmitted${data.notes ? `: ${data.notes}` : ''}. Documents: ${data.documentTypes.join(', ')}`,
      timestamp: new Date(),
      userId: new mongoose.Types.ObjectId(userId),
    };

    const updateData: Partial<IShipment> = {
      customsClearanceStatus: CustomsClearanceStatus.RESUBMITTED,
      customsDocuments: customsDocuments,
      customsClearanceEvents: [...(shipment.customsClearanceEvents || []), clearanceEvent],
      customsResubmissionCount: (shipment.customsResubmissionCount || 0) + 1,
      customsRejectionReason: undefined, // Clear rejection reason on resubmission
    };

    const updated = await this.repository.update(id, updateData);
    if (!updated) {
      throw new AppError('Failed to resubmit customs documents', 500);
    }

    // Add tracking event
    await this.repository.addTrackingEvent(id, {
      status: ShipmentStatus.IN_CLEARANCE,
      description: `Customs documents resubmitted after rejection`,
      userId: new mongoose.Types.ObjectId(userId),
    });

    const finalShipment = await this.repository.findById(id);
    return this.toShipmentResponse(finalShipment!);
  }

  /**
   * Delete shipment (soft delete)
   */
  async deleteShipment(id: string): Promise<void> {
    const shipment = await this.repository.findById(id);
    if (!shipment) {
      throw new AppError('Shipment not found', 404);
    }

    await this.repository.softDelete(id);
  }

  /**
   * Convert IShipment to ShipmentResponse
   */
  private toShipmentResponse(shipment: IShipment): ShipmentResponse {
    return {
      id: shipment._id.toString(),
      contractId: shipment.contractId.toString(),
      companyId: shipment.companyId.toString(),
      logisticsCompanyId: shipment.logisticsCompanyId.toString(),
      status: shipment.status,
      currentLocation: shipment.currentLocation,
      origin: shipment.origin,
      destination: shipment.destination,
      estimatedDeliveryDate: shipment.estimatedDeliveryDate,
      actualDeliveryDate: shipment.actualDeliveryDate,
      inspectionStatus: shipment.inspectionStatus,
      inspectedAt: shipment.inspectedAt,
      inspectedBy: shipment.inspectedBy?.toString(),
      inspectionRejectionReason: shipment.inspectionRejectionReason,
      // Customs Clearance Fields
      customsClearanceStatus: shipment.customsClearanceStatus,
      customsDocuments: shipment.customsDocuments?.map((doc) => ({
        uploadId: doc.uploadId.toString(),
        documentType: doc.documentType,
        fileName: doc.fileName,
        uploadedAt: doc.uploadedAt,
        uploadedBy: doc.uploadedBy.toString(),
      })),
      customsClearanceEvents: shipment.customsClearanceEvents?.map((event) => ({
        status: event.status,
        description: event.description,
        timestamp: event.timestamp,
        userId: event.userId.toString(),
        rejectionReason: event.rejectionReason,
        customsOfficerId: event.customsOfficerId?.toString(),
        customsAuthority: event.customsAuthority,
      })),
      customsRejectionReason: shipment.customsRejectionReason,
      customsResubmissionCount: shipment.customsResubmissionCount,
      customsClearedAt: shipment.customsClearedAt,
      customsClearedBy: shipment.customsClearedBy?.toString(),
      customsAuthority: shipment.customsAuthority,
      trackingEvents: shipment.trackingEvents.map((event) => ({
        ...event,
        userId: event.userId.toString(),
      })),
      createdAt: shipment.createdAt,
      updatedAt: shipment.updatedAt,
    };
  }
}
