import { User, IUser } from './schema';
import { Status } from '../../types/common';
import { Role } from '../../config/rbac';
import mongoose from 'mongoose';

export class UserRepository {
  /**
   * Create a new user
   */
  async create(data: Partial<IUser>): Promise<IUser> {
    const user = new User(data);
    return await user.save();
  }

  /**
   * Find user by ID (excluding soft-deleted)
   */
  async findById(id: string): Promise<IUser | null> {
    return await User.findOne({ _id: id, deletedAt: null });
  }

  /**
   * Find user by email (excluding soft-deleted)
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email: email.toLowerCase(), deletedAt: null });
  }

  /**
   * Find user by email with password (for authentication)
   */
  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return await User.findOne({ email: email.toLowerCase(), deletedAt: null })
      .select('+password');
  }

  /**
   * Find user by ID with password (for password verification)
   */
  async findByIdWithPassword(id: string): Promise<IUser | null> {
    return await User.findOne({ _id: id, deletedAt: null })
      .select('+password');
  }

  /**
   * Find users by company ID
   */
  async findByCompanyId(
    companyId: string,
    filters?: { role?: Role; status?: Status }
  ): Promise<IUser[]> {
    const query: Record<string, unknown> = {
      companyId: new mongoose.Types.ObjectId(companyId),
      deletedAt: null,
    };

    if (filters?.role) {
      query.role = filters.role;
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    return await User.find(query);
  }

  /**
   * Batch load users by IDs (optimized for N+1 query prevention)
   */
  async findByIds(userIds: string[]): Promise<IUser[]> {
    if (userIds.length === 0) {
      return [];
    }

    const ids = userIds.map((id) => new mongoose.Types.ObjectId(id));
    return await User.find({
      _id: { $in: ids },
      deletedAt: null,
    });
  }

  /**
   * Update user
   */
  async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  /**
   * Soft delete user
   */
  async softDelete(id: string): Promise<void> {
    await User.findByIdAndUpdate(id, { deletedAt: new Date() });
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    await User.findByIdAndUpdate(id, { lastLogin: new Date() });
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await User.findByIdAndUpdate(id, { 
      password: hashedPassword,
      updatedAt: new Date() 
    });
  }

  /**
   * Find users by role (across all companies)
   */
  async findByRole(role: Role, filters?: { status?: Status }): Promise<IUser[]> {
    const query: Record<string, unknown> = {
      role,
      deletedAt: null,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    return await User.find(query);
  }

  /**
   * Find all users (excluding soft-deleted)
   * Used by admin to view all users across all companies
   */
  async findAll(filters?: { role?: Role; status?: Status }): Promise<IUser[]> {
    const query: Record<string, unknown> = {
      deletedAt: null,
    };

    if (filters?.role) {
      query.role = filters.role;
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    return await User.find(query).sort({ createdAt: -1 });
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const query: Record<string, unknown> = {
      email: email.toLowerCase(),
      deletedAt: null,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await User.countDocuments(query);
    return count > 0;
  }
}
