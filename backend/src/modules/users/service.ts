import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { UserRepository } from './repository';
import { CreateUserDto, UpdateUserDto, UpdateUserProfileDto, UserResponse } from './types';
import { config } from '../../config/env';
import { AppError } from '../../middlewares/error.middleware';
import { IUser } from './schema';
import { CompanyRepository } from '../companies/repository';
import { Status } from '../../types/common';
import { Role } from '../../config/rbac';

export class UserService {
  private repository: UserRepository;
  private companyRepository: CompanyRepository;

  constructor() {
    this.repository = new UserRepository();
    this.companyRepository = new CompanyRepository();
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, config.security.bcryptRounds);
  }

  /**
   * Create a new user
   * Users belong to exactly one company
   * Company must exist and be approved (unless admin is creating the user)
   */
  async createUser(data: CreateUserDto, skipCompanyCheck: boolean = false): Promise<UserResponse> {
    // Check if email already exists
    const emailExists = await this.repository.emailExists(data.email);
    if (emailExists) {
      throw new AppError('Email already registered', 400);
    }

    // Verify company exists and is approved (unless admin is creating)
    if (!skipCompanyCheck) {
      const company = await this.companyRepository.findById(data.companyId);
      if (!company) {
        throw new AppError('Company not found', 404);
      }
      if (company.status !== Status.APPROVED) {
        throw new AppError('Cannot create user for unapproved company', 403);
      }
    }

    // Hash password
    const hashedPassword = await this.hashPassword(data.password);

    // Create user
    const user = await this.repository.create({
      ...data,
      companyId: new mongoose.Types.ObjectId(data.companyId),
      password: hashedPassword,
    });

    return this.toUserResponse(user);
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string, requesterCompanyId?: string): Promise<UserResponse> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Enforce company isolation (unless requester is admin)
    if (requesterCompanyId && user.companyId.toString() !== requesterCompanyId) {
      throw new AppError('Access denied: User belongs to different company', 403);
    }

    return this.toUserResponse(user);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<UserResponse | null> {
    const user = await this.repository.findByEmail(email);
    return user ? this.toUserResponse(user) : null;
  }

  /**
   * Get users by company ID
   */
  async getUsersByCompanyId(
    companyId: string,
    filters?: { role?: string; status?: string }
  ): Promise<UserResponse[]> {
    const repositoryFilters = filters ? {
      role: filters.role as Role | undefined,
      status: filters.status as Status | undefined,
    } : undefined;
    const users = await this.repository.findByCompanyId(companyId, repositoryFilters);
    const userResponses = await Promise.all(
      users.map(async (user) => {
        const response = this.toUserResponse(user);
        // Fetch company name
        try {
          const company = await this.companyRepository.findById(companyId);
          if (company) {
            response.companyName = company.name;
          }
        } catch (error) {
          // If company not found, companyName will be undefined
        }
        return response;
      })
    );
    return userResponses;
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(filters?: { role?: string; status?: string }): Promise<UserResponse[]> {
    const repositoryFilters = filters ? {
      role: filters.role as Role | undefined,
      status: filters.status as Status | undefined,
    } : undefined;
    const users = await this.repository.findAll(repositoryFilters);
    const userResponses = await Promise.all(
      users.map(async (user) => {
        const response = this.toUserResponse(user);
        // Fetch company name
        try {
          const company = await this.companyRepository.findById(user.companyId.toString());
          if (company) {
            response.companyName = company.name;
          }
        } catch (error) {
          // If company not found, companyName will be undefined
        }
        return response;
      })
    );
    return userResponses;
  }

  /**
   * Validate phone number format
   * Accepts international format with optional + prefix, digits, spaces, hyphens, parentheses
   */
  private validatePhoneNumber(phone: string): boolean {
    // Phone regex: allows international format with optional +, digits, spaces, hyphens, parentheses
    // Examples: +1234567890, (123) 456-7890, 123-456-7890, +971 50 123 4567
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}[-\s\.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Update user profile (self-update)
   * Users can only update their own profile (firstName, lastName, phone)
   */
  async updateMyProfile(userId: string, data: UpdateUserProfileDto): Promise<UserResponse> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Validate phone number if provided
    if (data.phone && !this.validatePhoneNumber(data.phone)) {
      throw new AppError('Invalid phone number format', 400);
    }

    // Only allow updating firstName, lastName, and phone
    const updateData: UpdateUserDto = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key as keyof UpdateUserDto] === undefined) {
        delete updateData[key as keyof UpdateUserDto];
      }
    });

    const updatedUser = await this.repository.update(userId, updateData);
    if (!updatedUser) {
      throw new AppError('Failed to update profile', 500);
    }

    return this.toUserResponse(updatedUser);
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: UpdateUserDto, requesterCompanyId?: string): Promise<UserResponse> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Enforce company isolation (unless requester is admin)
    if (requesterCompanyId && user.companyId.toString() !== requesterCompanyId) {
      throw new AppError('Access denied: User belongs to different company', 403);
    }

    const updatedUser = await this.repository.update(id, data);
    if (!updatedUser) {
      throw new AppError('Failed to update user', 500);
    }

    return this.toUserResponse(updatedUser);
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(id: string, requesterCompanyId?: string): Promise<void> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Enforce company isolation (unless requester is admin)
    if (requesterCompanyId && user.companyId.toString() !== requesterCompanyId) {
      throw new AppError('Access denied: User belongs to different company', 403);
    }

    await this.repository.softDelete(id);
  }

  /**
   * Verify password
   */
  async verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Get user with password (for authentication)
   */
  async getUserWithPassword(email: string): Promise<IUser | null> {
    return await this.repository.findByEmailWithPassword(email);
  }

  /**
   * Update last login
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.repository.updateLastLogin(id);
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await this.hashPassword(newPassword);
    await this.repository.updatePassword(id, hashedPassword);
  }

  /**
   * Change user password (verifies current password first)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Get user with password
    const user = await this.repository.findByIdWithPassword(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await this.verifyPassword(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Check if new password is different from current password
    const isSamePassword = await this.verifyPassword(newPassword, user.password);
    if (isSamePassword) {
      throw new AppError('New password must be different from current password', 400);
    }

    // Update password
    await this.updatePassword(userId, newPassword);
  }

  /**
   * Convert IUser to UserResponse
   */
  private toUserResponse(user: IUser): UserResponse {
    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      companyId: user.companyId.toString(),
      status: user.status,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      lastLogin: user.lastLogin,
      customPermissions: user.customPermissions || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
