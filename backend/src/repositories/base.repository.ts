/**
 * Base Repository with Company Isolation
 * Ensures all queries are filtered by companyId at repository level
 * Provides defense-in-depth for multi-tenant data isolation
 */

import mongoose, { Model, FilterQuery, Document } from 'mongoose';
import { Role } from '../config/rbac';
import { logger } from '../utils/logger';

export interface QueryContext {
  userId: string;
  companyId: string;
  role: Role;
}

export abstract class BaseRepository<T extends Document> {
  protected model: Model<T>;
  protected abstract companyIdField: string;

  constructor(model: Model<T>) {
    this.model = model;
  }

  /**
   * Apply company isolation filter
   * Always enforces company isolation at repository level
   * This provides defense-in-depth beyond middleware
   */
  protected applyCompanyFilter(
    query: FilterQuery<T>,
    context: QueryContext
  ): FilterQuery<T> {
    // Admin and Government can see all companies
    if (context.role === Role.ADMIN || context.role === Role.GOVERNMENT) {
      return query;
    }

    // Enforce company isolation for all other roles
    if (!context.companyId) {
      logger.warn(
        `Company ID required for non-admin user ${context.userId} (Role: ${context.role})`
      );
      throw new Error('Company ID required for non-admin users');
    }

    // Add company filter to query
    // Handle both direct companyId and nested companyId fields
    const companyFilter: any = {
      [this.companyIdField]: new mongoose.Types.ObjectId(context.companyId),
    };

    // Merge with existing query
    return {
      ...query,
      ...companyFilter,
      deletedAt: null, // Always exclude soft-deleted records
    };
  }

  /**
   * Verify resource belongs to company
   * Used for ownership verification before operations
   */
  protected async verifyCompanyOwnership(
    resourceId: string,
    context: QueryContext
  ): Promise<boolean> {
    if (context.role === Role.ADMIN || context.role === Role.GOVERNMENT) {
      return true;
    }

    if (!context.companyId) {
      return false;
    }

    try {
      const resource = await this.model
        .findById(resourceId)
        .select(this.companyIdField)
        .lean();

      if (!resource) {
        return false;
      }

      const resourceCompanyId = (resource as any)[this.companyIdField]?.toString();
      return resourceCompanyId === context.companyId;
    } catch (error) {
      logger.error('Error verifying company ownership:', error);
      return false;
    }
  }

  /**
   * Find by ID with company check
   */
  async findById(id: string, context: QueryContext): Promise<T | null> {
    const query: FilterQuery<T> = { _id: id };
    const filteredQuery = this.applyCompanyFilter(query, context);
    return await this.model.findOne(filteredQuery).exec();
  }

  /**
   * Find with company filter
   */
  async find(
    filter: FilterQuery<T>,
    context: QueryContext
  ): Promise<T[]> {
    const filteredQuery = this.applyCompanyFilter(filter, context);
    return await this.model.find(filteredQuery).exec();
  }

  /**
   * Find one with company filter
   */
  async findOne(
    filter: FilterQuery<T>,
    context: QueryContext
  ): Promise<T | null> {
    const filteredQuery = this.applyCompanyFilter(filter, context);
    return await this.model.findOne(filteredQuery).exec();
  }

  /**
   * Count with company filter
   */
  async count(
    filter: FilterQuery<T>,
    context: QueryContext
  ): Promise<number> {
    const filteredQuery = this.applyCompanyFilter(filter, context);
    return await this.model.countDocuments(filteredQuery).exec();
  }

  /**
   * Create with automatic companyId assignment
   */
  async create(
    data: Partial<T>,
    context: QueryContext
  ): Promise<T> {
    // Ensure companyId is set for non-admin users
    if (context.role !== Role.ADMIN && context.role !== Role.GOVERNMENT) {
      if (!context.companyId) {
        throw new Error('Company ID required for resource creation');
      }
      (data as any)[this.companyIdField] = new mongoose.Types.ObjectId(context.companyId);
    }

    const document = new this.model(data);
    return await document.save();
  }

  /**
   * Update with company ownership check
   */
  async update(
    id: string,
    data: Partial<T>,
    context: QueryContext
  ): Promise<T | null> {
    // Verify ownership before update
    const hasAccess = await this.verifyCompanyOwnership(id, context);
    if (!hasAccess) {
      throw new Error('Access denied: Resource belongs to different company');
    }

    // Prevent companyId modification
    if ((data as any)[this.companyIdField]) {
      delete (data as any)[this.companyIdField];
    }

    return await this.model
      .findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .exec();
  }

  /**
   * Delete (soft delete) with company ownership check
   */
  async delete(id: string, context: QueryContext): Promise<boolean> {
    // Verify ownership before delete
    const hasAccess = await this.verifyCompanyOwnership(id, context);
    if (!hasAccess) {
      throw new Error('Access denied: Resource belongs to different company');
    }

    const result = await this.model
      .findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true })
      .exec();

    return result !== null;
  }

  /**
   * Find with pagination and company filter
   */
  async findPaginated(
    filter: FilterQuery<T>,
    context: QueryContext,
    options: {
      page?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
    } = {}
  ): Promise<{ data: T[]; total: number; page: number; limit: number; totalPages: number }> {
    const filteredQuery = this.applyCompanyFilter(filter, context);
    
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? Math.min(options.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model
        .find(filteredQuery)
        .sort(options.sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments(filteredQuery).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
