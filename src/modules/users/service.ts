import bcrypt from 'bcrypt';
import { UserRepository } from './repository';
import { CreateUserDto, UpdateUserDto, UserResponse } from './types';
import { config } from '../../config/env';
import { AppError } from '../../middlewares/error.middleware';
import { IUser } from './schema';

export class UserService {
  private repository: UserRepository;

  constructor() {
    this.repository = new UserRepository();
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, config.security.bcryptRounds);
  }

  /**
   * Create a new user
   */
  async createUser(data: CreateUserDto): Promise<UserResponse> {
    // Check if email already exists
    const emailExists = await this.repository.emailExists(data.email);
    if (emailExists) {
      throw new AppError('Email already registered', 400);
    }

    // Hash password
    const hashedPassword = await this.hashPassword(data.password);

    // Create user
    const user = await this.repository.create({
      ...data,
      password: hashedPassword,
    });

    return this.toUserResponse(user);
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<UserResponse> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
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
    const users = await this.repository.findByCompanyId(companyId, filters);
    return users.map((user) => this.toUserResponse(user));
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: UpdateUserDto): Promise<UserResponse> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
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
  async deleteUser(id: string): Promise<void> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
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
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
