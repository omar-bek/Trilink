import { Request, Response, NextFunction } from 'express';
import { UserService } from './service';
import { CreateUserDto, UpdateUserDto } from './types';
import { ApiResponse } from '../../types/common';
import { AppError } from '../../middlewares/error.middleware';
import { getRequestId } from '../../utils/requestId';

export class UserController {
  private service: UserService;

  constructor() {
    this.service = new UserService();
  }

  /**
   * Create a new user
   * POST /api/users
   */
  createUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data: CreateUserDto = req.body;
      const user = await this.service.createUser(data);

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
      const user = await this.service.getUserById(id);

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
      const user = await this.service.updateUser(id, data);

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
      await this.service.deleteUser(id);

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
}
