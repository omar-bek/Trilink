import { Request, Response, NextFunction } from 'express';
import { AuthService } from './service';
import { LoginDto, RegisterDto, RegisterCompanyDto, ForgotPasswordDto, ResetPasswordDto } from './types';
import { ApiResponse } from '../../types/common';
import { getRequestId } from '../../utils/requestId';
import { setRefreshTokenCookie, clearRefreshTokenCookie, getRefreshTokenFromCookie } from '../../utils/cookies';
import { logger } from '../../utils/logger';

export class AuthController {
  private service: AuthService;

  constructor() {
    this.service = new AuthService();
  }

  /**
   * Register a new company with the first user (Company Manager)
   * POST /api/auth/register-company
   * Sets refreshToken in httpOnly cookie
   */
  registerCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data: RegisterCompanyDto = req.body;
      const result = await this.service.registerCompany(data);

      // Set refreshToken in httpOnly cookie (secure, sameSite strict)
      setRefreshTokenCookie(res, result.refreshToken);

      // Return accessToken and user (refreshToken not in response body)
      const response: ApiResponse = {
        success: true,
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
        requestId: getRequestId(req),
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Register a new user
   * POST /api/auth/register
   * Sets refreshToken in httpOnly cookie
   */
  register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data: RegisterDto = req.body;
      const result = await this.service.register(data);

      // Set refreshToken in httpOnly cookie (secure, sameSite strict)
      setRefreshTokenCookie(res, result.refreshToken);

      // Return accessToken and user (refreshToken not in response body)
      const response: ApiResponse = {
        success: true,
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
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
   * Sets refreshToken in httpOnly cookie
   */
  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data: LoginDto = req.body;
      const result = await this.service.login(data);

      // Set refreshToken in httpOnly cookie (secure, sameSite strict)
      setRefreshTokenCookie(res, result.refreshToken);

      // Return accessToken and user (refreshToken not in response body)
      const response: ApiResponse = {
        success: true,
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
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
   * Reads refreshToken from httpOnly cookie
   * Returns new accessToken and user data
   * Implements token rotation for security
   */
  refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Get refreshToken from httpOnly cookie (not request body)
      const refreshToken = getRefreshTokenFromCookie(req);
      
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token not found',
          requestId: getRequestId(req),
        });
      }

      // Refresh token and get new tokens (token rotation)
      const result = await this.service.refreshToken(refreshToken);

      // Set new refreshToken in httpOnly cookie (token rotation)
      setRefreshTokenCookie(res, result.refreshToken);

      // Return accessToken and user (refreshToken not in response body)
      const response: ApiResponse = {
        success: true,
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Request password reset
   * POST /api/auth/forgot-password
   */
  forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data: ForgotPasswordDto = req.body;
      await this.service.forgotPassword(data);

      // Always return success to prevent email enumeration
      const response: ApiResponse = {
        success: true,
        data: {
          message: 'If an account exists with this email, a password reset link has been sent.',
        },
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reset password using token
   * POST /api/auth/reset-password
   */
  resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data: ResetPasswordDto = req.body;
      await this.service.resetPassword(data);

      const response: ApiResponse = {
        success: true,
        data: {
          message: 'Password has been reset successfully.',
        },
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logout user
   * POST /api/auth/logout
   * Blacklists tokens and clears refreshToken httpOnly cookie
   */
  logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { getTokenBlacklistService } = await import('../../utils/token-blacklist.service');
      const blacklistService = getTokenBlacklistService();

      // Blacklist access token if present
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          await blacklistService.blacklistToken(token);
        } catch (error) {
          logger.error('Failed to blacklist access token on logout:', error);
          // Continue with logout even if blacklisting fails
        }
      }

      // Blacklist refresh token from cookie
      const refreshToken = req.cookies?.refreshToken;
      if (refreshToken) {
        try {
          await blacklistService.blacklistRefreshToken(refreshToken);
        } catch (error) {
          logger.error('Failed to blacklist refresh token on logout:', error);
        }
      }

      // Clear refreshToken httpOnly cookie
      clearRefreshTokenCookie(res);

      const response: ApiResponse = {
        success: true,
        data: {
          message: 'Logged out successfully.',
        },
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
