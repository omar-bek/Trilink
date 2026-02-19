import { Request, Response, NextFunction } from 'express';
import { AuthService } from './service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './types';
import { ApiResponse } from '../../types/common';
import { getRequestId } from '../../utils/requestId';

export class AuthController {
  private service: AuthService;

  constructor() {
    this.service = new AuthService();
  }

  /**
   * Register a new user
   * POST /api/auth/register
   */
  register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data: RegisterDto = req.body;
      const result = await this.service.register(data);

      const response: ApiResponse = {
        success: true,
        data: result,
        requestId: getRequestId(req),
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Login user
   * POST /api/auth/login
   */
  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data: LoginDto = req.body;
      const result = await this.service.login(data);

      const response: ApiResponse = {
        success: true,
        data: result,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data: RefreshTokenDto = req.body;
      const result = await this.service.refreshToken(data);

      const response: ApiResponse = {
        success: true,
        data: result,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
