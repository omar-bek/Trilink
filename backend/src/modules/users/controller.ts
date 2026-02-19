import { Request, Response, NextFunction } from 'express';
import { UserService } from './service';
import { CreateUserDto, UpdateUserDto, UpdateUserProfileDto, ChangePasswordDto } from './types';
import { ApiResponse } from '../../types/common';
import { AppError } from '../../middlewares/error.middleware';
import { getRequestId } from '../../utils/requestId';
import { Role, Permission } from '../../config/rbac';

export class UserController {
  private service: UserService;

  constructor() {
    this.service = new UserService();
  }

  /**
   * Create a new user
   * POST /api/users
   * Users belong to exactly one company
   * Company Manager can only create users for their own company
   */
  createUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const data: CreateUserDto = req.body;

      // Company Manager can only create users for their own company
      if (req.user.role === Role.COMPANY_MANAGER) {
        if (!req.user.companyId) {
          throw new AppError('Company Manager must belong to a company', 403);
        }
        // Override companyId to ensure Company Manager can only create users for their company
        data.companyId = req.user.companyId;
      }

      // Admin can create users for any company, skip company approval check
      const skipCompanyCheck = req.user.role === Role.ADMIN;
      const user = await this.service.createUser(data, skipCompanyCheck);

      const response: ApiResponse = {
        success: true,
        data: user,
        requestId: getRequestId(req),
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  getUserById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      // Enforce company isolation: only admin can access users from other companies
      const requesterCompanyId =
        req.user?.role === Role.ADMIN ? undefined : req.user?.companyId;
      const user = await this.service.getUserById(id, requesterCompanyId);

      const response: ApiResponse = {
        success: true,
        data: user,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all users (admin only)
   * GET /api/users
   */
  getAllUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Only admin can access all users
      if (req.user?.role !== Role.ADMIN) {
        throw new AppError('Access denied: Admin role required', 403);
      }

      const { role, status } = req.query;

      const filters: { role?: string; status?: string } = {};
      if (role) filters.role = role as string;
      if (status) filters.status = status as string;

      const users = await this.service.getAllUsers(filters);

      const response: ApiResponse = {
        success: true,
        data: users,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get users by company
   * GET /api/users/company/:companyId
   */
  getUsersByCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { companyId } = req.params;
      const { role, status } = req.query;

      const filters: { role?: string; status?: string } = {};
      if (role) filters.role = role as string;
      if (status) filters.status = status as string;

      const users = await this.service.getUsersByCompanyId(companyId, filters);

      const response: ApiResponse = {
        success: true,
        data: users,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update my profile (self-update)
   * PATCH /api/users/me
   * Users can only update their own profile (firstName, lastName, phone)
   */
  updateMyProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const data: UpdateUserProfileDto = req.body;
      const user = await this.service.updateMyProfile(req.user.userId, data);

      const response: ApiResponse = {
        success: true,
        data: user,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user
   * PATCH /api/users/:id
   */
  updateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const data: UpdateUserDto = req.body;
      // Enforce company isolation: only admin can update users from other companies
      const requesterCompanyId =
        req.user?.role === Role.ADMIN ? undefined : req.user?.companyId;
      const user = await this.service.updateUser(id, data, requesterCompanyId);

      const response: ApiResponse = {
        success: true,
        data: user,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete user (soft delete)
   * DELETE /api/users/:id
   */
  deleteUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      // Enforce company isolation: only admin can delete users from other companies
      const requesterCompanyId =
        req.user?.role === Role.ADMIN ? undefined : req.user?.companyId;
      await this.service.deleteUser(id, requesterCompanyId);

      const response: ApiResponse = {
        success: true,
        data: { message: 'User deleted successfully' },
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Change user password
   * POST /api/users/:id/change-password
   * Users can only change their own password (unless admin)
   */
  changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { id } = req.params;
      const data: ChangePasswordDto = req.body;

      // Users can only change their own password (unless admin)
      if (req.user.userId !== id && req.user.role !== Role.ADMIN) {
        throw new AppError('You can only change your own password', 403);
      }

      // Validate that new password and confirm password match
      if (data.newPassword !== data.confirmPassword) {
        throw new AppError('New password and confirm password do not match', 400);
      }

      await this.service.changePassword(id, data.currentPassword, data.newPassword);

      const response: ApiResponse = {
        success: true,
        data: { message: 'Password changed successfully' },
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user permissions
   * PATCH /api/users/:id/permissions
   * Company Manager can update permissions for users in their company
   */
  updateUserPermissions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { customPermissions } = req.body as { customPermissions?: Permission[] };

      if (!Array.isArray(customPermissions)) {
        throw new AppError('customPermissions must be an array', 400);
      }

      // Validate permissions
      const validPermissions = Object.values(Permission);
      const invalidPermissions = customPermissions.filter(
        (perm) => !validPermissions.includes(perm)
      );
      if (invalidPermissions.length > 0) {
        throw new AppError(`Invalid permissions: ${invalidPermissions.join(', ')}`, 400);
      }

      // Enforce company isolation: only admin can update users from other companies
      const requesterCompanyId =
        req.user?.role === Role.ADMIN ? undefined : req.user?.companyId;

      const user = await this.service.updateUser(
        id,
        { customPermissions },
        requesterCompanyId
      );

      const response: ApiResponse = {
        success: true,
        data: user,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
