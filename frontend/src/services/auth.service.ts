import api from './api';
import { ApiResponse, LoginCredentials, RegisterData, RegisterCompanyData, AuthTokens, User } from '@/types';

/**
 * Secure Authentication Service
 * 
 * Security improvements:
 * - Refresh token stored in httpOnly cookie (backend handles it)
 * - No localStorage manipulation
 * - Logout calls backend to clear httpOnly cookie
 */
export const authService = {
  /**
   * Login - Backend sets refreshToken in httpOnly cookie
   * Returns accessToken and user data (refreshToken not in response)
   */
  login: async (credentials: LoginCredentials): Promise<ApiResponse<{ accessToken: string; user: User }>> => {
    const response = await api.post<ApiResponse<{ accessToken: string; user: User }>>('/auth/login', credentials);
    // Backend automatically sets refreshToken in httpOnly cookie via Set-Cookie header
    return response.data;
  },

  /**
   * Register Company - Backend sets refreshToken in httpOnly cookie
   * Returns accessToken and user data (refreshToken not in response)
   */
  registerCompany: async (data: RegisterCompanyData): Promise<ApiResponse<{ accessToken: string; user: User }>> => {
    const response = await api.post<ApiResponse<{ accessToken: string; user: User }>>('/auth/register-company', data);
    // Backend automatically sets refreshToken in httpOnly cookie via Set-Cookie header
    return response.data;
  },

  /**
   * Register - Backend sets refreshToken in httpOnly cookie
   * Returns accessToken and user data (refreshToken not in response)
   */
  register: async (data: RegisterData): Promise<ApiResponse<{ accessToken: string; user: User }>> => {
    const response = await api.post<ApiResponse<{ accessToken: string; user: User }>>('/auth/register', data);
    // Backend automatically sets refreshToken in httpOnly cookie via Set-Cookie header
    return response.data;
  },

  /**
   * Refresh token - Backend reads refreshToken from httpOnly cookie
   * No need to send refreshToken in request body
   * Returns new accessToken and user data
   */
  refreshToken: async (): Promise<ApiResponse<{ accessToken: string; user: User }>> => {
    // Backend reads refreshToken from httpOnly cookie automatically
    // Empty body - refreshToken comes from cookie
    const response = await api.post<ApiResponse<{ accessToken: string; user: User }>>('/auth/refresh', {});
    return response.data;
  },

  /**
   * Logout - Backend clears httpOnly cookie
   * Frontend clears in-memory state
   */
  logout: async (): Promise<void> => {
    // Backend will clear httpOnly cookie via Set-Cookie header
    await api.post('/auth/logout', {});
    // Frontend clears in-memory state (handled by auth store)
  },
};
