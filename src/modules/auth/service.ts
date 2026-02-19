import { UserService } from '../users/service';
import { CompanyService } from '../companies/service';
import { LoginDto, RegisterDto, RefreshTokenDto, AuthResponse, TokenResponse } from './types';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, JWTPayload } from '../../utils/jwt';
import { AppError } from '../../middlewares/error.middleware';
import { Role } from '../../config/rbac';

export class AuthService {
  private userService: UserService;
  private companyService: CompanyService;

  constructor() {
    this.userService = new UserService();
    this.companyService = new CompanyService();
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
   * Refresh access token using refresh token
   */
  async refreshToken(data: RefreshTokenDto): Promise<TokenResponse> {
    try {
      // Verify refresh token
      const payload = verifyRefreshToken(data.refreshToken);

      // Get user to verify still exists and is active
      const user = await this.userService.getUserById(payload.userId);
      if (user.status !== 'active') {
        throw new AppError('Account is not active', 403);
      }

      // Generate new tokens (token rotation)
      const newPayload: JWTPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      };

      const accessToken = generateAccessToken(newPayload);
      const refreshToken = generateRefreshToken(newPayload);

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }
}
