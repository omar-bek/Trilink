import { ShipmentRepository } from './repository';
import {
  CreateShipmentDto,
  UpdateShipmentStatusDto,
  UpdateGPSLocationDto,
  ShipmentResponse,
} from './types';
import { AppError } from '../../middlewares/error.middleware';
import { IShipment, ShipmentStatus } from './schema';
import { ContractRepository } from '../contracts/repository';
import mongoose from 'mongoose';

export class ShipmentService {
  private repository: ShipmentRepository;
  private contractRepository: ContractRepository;

  constructor() {
    this.repository = new ShipmentRepository();
    this.contractRepository = new ContractRepository();
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
      companyId,
      contractId: new mongoose.Types.ObjectId(data.contractId),
      logisticsCompanyId: new mongoose.Types.ObjectId(data.logisticsCompanyId),
      estimatedDeliveryDate: new Date(data.estimatedDeliveryDate),
      status: ShipmentStatus.PENDING,
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
   */
  async updateGPSLocation(
    id: string,
    data: UpdateGPSLocationDto
  ): Promise<ShipmentResponse> {
    const shipment = await this.repository.findById(id);
    if (!shipment) {
      throw new AppError('Shipment not found', 404);
    }

    const updated = await this.repository.updateGPSLocation(id, data);
    if (!updated) {
      throw new AppError('Failed to update GPS location', 500);
    }

    return this.toShipmentResponse(updated);
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
      trackingEvents: shipment.trackingEvents.map((event) => ({
        ...event,
        userId: event.userId.toString(),
      })),
      createdAt: shipment.createdAt,
      updatedAt: shipment.updatedAt,
    };
  }
}
