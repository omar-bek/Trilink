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
   * Optionally populate related documents
   */
  async findById(id: string, populate?: boolean): Promise<IShipment | null> {
    let query = Shipment.findOne({ _id: id, deletedAt: null });
    
    if (populate) {
      query = query
        .populate('companyId', 'name type email')
        .populate('logisticsCompanyId', 'name type email')
        .populate('contractId', 'status parties amounts')
        .populate('trackingEvents.userId', 'email firstName lastName');
    }
    
    return await query.exec();
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
   * Optimized with populate for related data
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

    return await Shipment.find(query)
      .populate('companyId', 'name type email')
      .populate('logisticsCompanyId', 'name type email')
      .populate('contractId', 'status parties')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Find shipments by company ID with pagination
   */
  async findByCompanyIdPaginated(
    companyId: string,
    filters?: { status?: ShipmentStatus },
    options?: { skip?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<{ shipments: IShipment[]; total: number }> {
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

    const sort: Record<string, 1 | -1> = {};
    if (options?.sortBy) {
      sort[options.sortBy] = options.sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    const skip = options?.skip || 0;
    const limit = options?.limit || 20;

    const [shipments, total] = await Promise.all([
      Shipment.find(query)
        .populate('companyId', 'name type email')
        .populate('logisticsCompanyId', 'name type email')
        .populate('contractId', 'status parties')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      Shipment.countDocuments(query),
    ]);

    return { shipments, total };
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
