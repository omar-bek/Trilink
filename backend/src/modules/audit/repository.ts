import { AuditLog, IAuditLog } from './schema';
import mongoose from 'mongoose';
import { getTimestampService } from '../../utils/timestamp.service';

export interface AuditLogFilters {
  userId?: string;
  companyId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  status?: 'success' | 'failure';
  startDate?: Date;
  endDate?: Date;
}

export class AuditLogRepository {
  /**
   * Create a new audit log entry with cryptographic timestamping
   * Creates an immutable audit trail with verifiable timestamps
   */
  async create(data: Partial<IAuditLog>): Promise<IAuditLog> {
    const timestamp = new Date();
    const timestampService = getTimestampService();

    // Create cryptographic timestamp for immutability
    const timestampData = timestampService.createAuditLogTimestamp({
      userId: data.userId?.toString() || '',
      action: data.action?.toString() || '',
      resource: data.resource?.toString() || '',
      resourceId: data.resourceId?.toString(),
      timestamp,
    });

    const auditLog = new AuditLog({
      ...data,
      timestamp,
      timestampHash: timestampData.hash,
      timestampSignature: timestampData.signature,
      immutable: true, // All audit logs are immutable
    });
    return await auditLog.save();
  }

  /**
   * Find audit logs with filters
   */
  async find(filters: AuditLogFilters, limit: number = 100, skip: number = 0): Promise<IAuditLog[]> {
    const query: Record<string, unknown> = {};

    if (filters.userId) {
      query.userId = new mongoose.Types.ObjectId(filters.userId);
    }

    if (filters.companyId) {
      query.companyId = new mongoose.Types.ObjectId(filters.companyId);
    }

    if (filters.action) {
      query.action = filters.action;
    }

    if (filters.resource) {
      query.resource = filters.resource;
    }

    if (filters.resourceId) {
      query.resourceId = new mongoose.Types.ObjectId(filters.resourceId);
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) {
        query.timestamp = { ...query.timestamp as Record<string, unknown>, $gte: filters.startDate };
      }
      if (filters.endDate) {
        query.timestamp = { ...query.timestamp as Record<string, unknown>, $lte: filters.endDate };
      }
    }

    return await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .populate('userId', 'email role')
      .populate('companyId', 'name');
  }

  /**
   * Count audit logs with filters
   */
  async count(filters: AuditLogFilters): Promise<number> {
    const query: Record<string, unknown> = {};

    if (filters.userId) {
      query.userId = new mongoose.Types.ObjectId(filters.userId);
    }

    if (filters.companyId) {
      query.companyId = new mongoose.Types.ObjectId(filters.companyId);
    }

    if (filters.action) {
      query.action = filters.action;
    }

    if (filters.resource) {
      query.resource = filters.resource;
    }

    if (filters.resourceId) {
      query.resourceId = new mongoose.Types.ObjectId(filters.resourceId);
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) {
        query.timestamp = { ...query.timestamp as Record<string, unknown>, $gte: filters.startDate };
      }
      if (filters.endDate) {
        query.timestamp = { ...query.timestamp as Record<string, unknown>, $lte: filters.endDate };
      }
    }

    return await AuditLog.countDocuments(query);
  }

  /**
   * Get audit logs by resource
   */
  async findByResource(resource: string, resourceId: string): Promise<IAuditLog[]> {
    return await AuditLog.find({
      resource,
      resourceId: new mongoose.Types.ObjectId(resourceId),
    })
      .sort({ timestamp: -1 })
      .populate('userId', 'email role')
      .populate('companyId', 'name');
  }

  /**
   * Get audit logs by user
   */
  async findByUser(userId: string, limit: number = 100): Promise<IAuditLog[]> {
    return await AuditLog.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('companyId', 'name');
  }

  /**
   * Get audit logs by company
   */
  async findByCompany(companyId: string, limit: number = 100): Promise<IAuditLog[]> {
    return await AuditLog.find({
      companyId: new mongoose.Types.ObjectId(companyId),
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'email role');
  }
}
