import { Shipment, IShipment } from './schema';
import { ShipmentStatus } from './schema';
import mongoose from 'mongoose';

export class ShipmentRepository {
  /**
   * Create a new shipment
   */
  async create(data: Partial<IShipment>): Promise<IShipment> {
    const shipment = new Shipment(data);
    return await shipment.save();
  }

  /**
   * Find shipment by ID
   */
  async findById(id: string): Promise<IShipment | null> {
    return await Shipment.findOne({ _id: id, deletedAt: null });
  }

  /**
   * Find shipments by contract ID
   */
  async findByContractId(contractId: string): Promise<IShipment[]> {
    return await Shipment.find({
      contractId: new mongoose.Types.ObjectId(contractId),
      deletedAt: null,
    });
  }

  /**
   * Find shipments by company ID
   */
  async findByCompanyId(
    companyId: string,
    filters?: { status?: ShipmentStatus }
  ): Promise<IShipment[]> {
    const query: Record<string, unknown> = {
      $or: [
        { companyId: new mongoose.Types.ObjectId(companyId) },
        { logisticsCompanyId: new mongoose.Types.ObjectId(companyId) },
      ],
      deletedAt: null,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    return await Shipment.find(query).sort({ createdAt: -1 });
  }

  /**
   * Update shipment
   */
  async update(
    id: string,
    data: Partial<IShipment>
  ): Promise<IShipment | null> {
    return await Shipment.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  /**
   * Add tracking event
   */
  async addTrackingEvent(
    id: string,
    event: {
      status: ShipmentStatus;
      location?: {
        address: string;
        coordinates: { lat: number; lng: number };
      };
      description: string;
      userId: mongoose.Types.ObjectId;
    }
  ): Promise<IShipment | null> {
    return await Shipment.findByIdAndUpdate(
      id,
      {
        $push: {
          trackingEvents: {
            ...event,
            timestamp: new Date(),
          },
        },
        status: event.status,
        currentLocation: event.location
          ? {
              ...event.location,
              lastUpdated: new Date(),
            }
          : undefined,
        updatedAt: new Date(),
      },
      { new: true }
    );
  }

  /**
   * Update GPS location
   */
  async updateGPSLocation(
    id: string,
    location: {
      coordinates: { lat: number; lng: number };
      address: string;
    }
  ): Promise<IShipment | null> {
    return await Shipment.findByIdAndUpdate(
      id,
      {
        currentLocation: {
          ...location,
          lastUpdated: new Date(),
        },
        updatedAt: new Date(),
      },
      { new: true }
    );
  }

  /**
   * Soft delete shipment
   */
  async softDelete(id: string): Promise<void> {
    await Shipment.findByIdAndUpdate(id, { deletedAt: new Date() });
  }
}
