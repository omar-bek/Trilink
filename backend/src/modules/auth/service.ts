import { UserService } from '../users/service';
import { CompanyService } from '../companies/service';
import { CompanyCategoryService } from '../company-categories/service';
import { LoginDto, RegisterDto, RegisterCompanyDto, AuthResponse, TokenResponse, ForgotPasswordDto, ResetPasswordDto } from './types';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, JWTPayload, generatePasswordResetToken, verifyPasswordResetToken } from '../../utils/jwt';
import { AppError } from '../../middlewares/error.middleware';
import { Role } from '../../config/rbac';
import { emailService } from '../notifications/email.service';
import { generatePasswordResetEmail, generatePasswordResetEmailText } from '../../utils/email-templates';
import { logger } from '../../utils/logger';
import { CompanyType } from '../companies/schema';

export class AuthService {
  private userService: UserService;
  private companyService: CompanyService;
  private companyCategoryService: CompanyCategoryService;

  constructor() {
    this.userService = new UserService();
    this.companyService = new CompanyService();
    this.companyCategoryService = new CompanyCategoryService();
  }

  /**
   * Register a new company with the first user (Company Manager)
   * Creates company with PENDING status and creates the owner as Company Manager
   */
  async registerCompany(data: RegisterCompanyDto): Promise<AuthResponse> {
    // Check if user email already exists
    const emailExists = await this.userService.getUserByEmail(data.email);
    if (emailExists) {
      throw new AppError('Email already registered', 400);
    }

    // Create company
    const company = await this.companyService.createCompany({
      name: data.companyName,
      registrationNumber: data.registrationNumber,
      type: data.companyType as CompanyType,
      email: data.companyEmail,
      phone: data.companyPhone,
      address: data.address,
      documents: data.documents || [],
    });

    // Create the first user (Company Manager) for the company
    // Skip company check since we just created it and it's pending
    const user = await this.userService.createUser({
      email: data.email,
      password: data.password,
      role: Role.COMPANY_MANAGER,
      companyId: company.id,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    }, true); // Skip company approval check since company is new

    // Add categories to company if provided
    if (data.categoryIds && data.categoryIds.length > 0) {
      try {
        await this.companyCategoryService.addCategoriesToCompany(company.id, data.categoryIds);
      } catch (error) {
        // Log error but don't fail registration if category assignment fails
        logger.error('Failed to add categories to company during registration', { error, companyId: company.id, categoryIds: data.categoryIds });
      }
    }

    // Generate tokens
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Register a new user
   */
  async register(data: RegisterDto): Promise<AuthResponse> {
    // Verify company exists
    const company = await this.companyService.getCompanyById(data.companyId);
    if (!company) {
      throw new AppError('Company not found', 404);
    }

    // Create user
    const user = await this.userService.createUser({
      email: data.email,
      password: data.password,
      role: data.role as Role,
      companyId: data.companyId,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    });

    // Generate tokens
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    // Get user with password
    const user = await this.userService.getUserWithPassword(data.email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Verify password
    const isValidPassword = await this.userService.verifyPassword(
      data.password,
      user.password
    );
    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new AppError('Account is not active', 403);
    }

    // Update last login
    await this.userService.updateLastLogin(user._id.toString());

    // Generate tokens
    const payload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      companyId: user.companyId.toString(),
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        companyId: user.companyId.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token using refresh token from httpOnly cookie
   * Returns new access token and user data
   * Refresh token is read from cookie, not request body
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const { getTokenBlacklistService } = await import('../../utils/token-blacklist.service');
      const blacklistService = getTokenBlacklistService();

      // Check if refresh token is blacklisted
      const isBlacklisted = await blacklistService.isRefreshTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new AppError('Refresh token has been revoked', 401);
      }

      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Check if user is globally blacklisted
      const isUserBlacklisted = await blacklistService.isUserBlacklisted(payload.userId);
      if (isUserBlacklisted) {
        throw new AppError('Token has been revoked', 401);
      }

      // Get user to verify still exists and is active
      const user = await this.userService.getUserById(payload.userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }
      if (user.status !== 'active') {
        throw new AppError('Account is not active', 403);
      }

      // Blacklist old refresh token (token rotation)
      await blacklistService.blacklistRefreshToken(refreshToken);

      // Generate new tokens (token rotation for security)
      const newPayload: JWTPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      };

      const accessToken = generateAccessToken(newPayload);
      const newRefreshToken = generateRefreshToken(newPayload);

      return {
        accessToken,
        refreshToken: newRefreshToken, // Return new refresh token to set in cookie
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  /**
   * Request password reset
   * Sends password reset email with token
   */
  async forgotPassword(data: ForgotPasswordDto): Promise<void> {
    // Find user by email
    const user = await this.userService.getUserByEmail(data.email);
    
    // Don't reveal if email exists or not (security best practice)
    // Always return success to prevent email enumeration attacks
    if (!user) {
      logger.warn(`Password reset requested for non-existent email: ${data.email}`);
      return; // Silently return success
    }

    // Check if user is active
    if (user.status !== 'active') {
      logger.warn(`Password reset requested for inactive user: ${data.email}`);
      return; // Silently return success
    }

    // Generate password reset token
    const resetToken = generatePasswordResetToken(user.id, user.email);

    // Prepare email
    const userName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined;
    const emailHtml = generatePasswordResetEmail(resetToken, userName);
    const emailText = generatePasswordResetEmailText(resetToken, userName);

    try {
      // Send password reset email
      await emailService.sendEmail({
        to: { email: user.email, name: userName },
        subject: 'Password Reset Request - TriLink Platform',
        template: 'password-reset',
        data: {
          html: emailHtml,
          text: emailText,
        },
      });

      logger.info(`Password reset email sent to: ${user.email}`);
    } catch (error) {
      logger.error(`Failed to send password reset email to ${user.email}:`, error);
      // Don't throw error - still return success to prevent email enumeration
      // In production, you might want to log this for monitoring
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(data: ResetPasswordDto): Promise<void> {
    try {
      // Verify reset token
      const payload = verifyPasswordResetToken(data.token);

      // Get user
      const user = await this.userService.getUserById(payload.userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify email matches (extra security check)
      if (user.email !== payload.email) {
        throw new AppError('Invalid token', 400);
      }

      // Check if user is active
      if (user.status !== 'active') {
        throw new AppError('Account is not active', 403);
      }

      // Validate password strength
      if (data.password.length < 8) {
        throw new AppError('Password must be at least 8 characters long', 400);
      }

      // Update password
      await this.userService.updatePassword(payload.userId, data.password);

      logger.info(`Password reset successful for user: ${user.email}`);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      // If token verification fails, throw appropriate error
      throw new AppError('Invalid or expired reset token', 400);
    }
  }
}
