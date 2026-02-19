import api from './api';
import { ApiResponse, PaginatedResponse } from '@/types';
import { UserProfile, UpdateUserProfileDto, ChangePasswordDto, CreateUserDto, UpdateUserDto } from '@/types/user';

export const userService = {
  /**
   * Get user by ID
   * GET /api/users/:id
   */
  getUserById: async (userId: string): Promise<ApiResponse<UserProfile>> => {
    const response = await api.get<ApiResponse<UserProfile>>(`/users/${userId}`);
    return response.data;
  },

  /**
   * Get all users (admin only)
   * GET /api/users
   */
  getAllUsers: async (filters?: { role?: string; status?: string }): Promise<ApiResponse<UserProfile[]>> => {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.status) params.append('status', filters.status);
    const queryString = params.toString();
    const url = `/users${queryString ? `?${queryString}` : ''}`;
    const response = await api.get<ApiResponse<UserProfile[]>>(url);
    return response.data;
  },

  /**
   * Get users by company
   * GET /api/users/company/:companyId
   */
  getUsersByCompany: async (companyId: string): Promise<ApiResponse<UserProfile[]>> => {
    const response = await api.get<ApiResponse<UserProfile[]>>(`/users/company/${companyId}`);
    return response.data;
  },

  /**
   * Create user
   * POST /api/users
   */
  createUser: async (data: CreateUserDto): Promise<ApiResponse<UserProfile>> => {
    const response = await api.post<ApiResponse<UserProfile>>('/users', data);
    return response.data;
  },

  /**
   * Update user
   * PATCH /api/users/:id
   */
  updateUser: async (
    userId: string,
    data: UpdateUserDto
  ): Promise<ApiResponse<UserProfile>> => {
    const response = await api.patch<ApiResponse<UserProfile>>(`/users/${userId}`, data);
    return response.data;
  },

  /**
   * Delete user
   * DELETE /api/users/:id
   */
  deleteUser: async (userId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/users/${userId}`);
    return response.data;
  },

  /**
   * Update current user profile (self-update)
   * PATCH /api/users/me
   */
  updateMyProfile: async (data: UpdateUserProfileDto): Promise<ApiResponse<UserProfile>> => {
    const response = await api.patch<ApiResponse<UserProfile>>('/users/me', data);
    return response.data;
  },

  /**
   * Get current user profile (alias for getUserById)
   * GET /api/users/:id
   */
  getCurrentUser: async (userId: string): Promise<ApiResponse<UserProfile>> => {
    return userService.getUserById(userId);
  },

  /**
   * Update user profile (alias for updateUser)
   * PATCH /api/users/:id
   */
  updateProfile: async (
    userId: string,
    data: UpdateUserProfileDto
  ): Promise<ApiResponse<UserProfile>> => {
    return userService.updateUser(userId, data);
  },

  /**
   * Change password
   * Note: This endpoint may not exist yet, placeholder for future implementation
   */
  changePassword: async (
    userId: string,
    data: ChangePasswordDto
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post<ApiResponse<{ message: string }>>(
      `/users/${userId}/change-password`,
      data
    );
    return response.data;
  },

  /**
   * Update user permissions
   * PATCH /api/users/:id/permissions
   */
  updateUserPermissions: async (
    userId: string,
    customPermissions: string[]
  ): Promise<ApiResponse<UserProfile>> => {
    const response = await api.patch<ApiResponse<UserProfile>>(
      `/users/${userId}/permissions`,
      { customPermissions }
    );
    return response.data;
  },
};
