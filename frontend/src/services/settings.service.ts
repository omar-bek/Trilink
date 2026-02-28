import api from './api';
import { ApiResponse } from '@/types';

export interface SystemSettings {
  // General Settings
  siteName: string;
  siteDescription: string;
  logo?: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;

  // Email Settings
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  fromEmail?: string;
  fromName?: string;

  // Security Settings
  sessionTimeout?: number;
  maxLoginAttempts?: number;
  requireEmailVerification?: boolean;
  requireTwoFactor?: boolean;
  passwordMinLength?: number;

  // Notification Settings
  enableEmailNotifications?: boolean;
  enableSmsNotifications?: boolean;
  enablePushNotifications?: boolean;

  // Storage Settings
  maxFileSize?: number;
  allowedFileTypes?: string;
  storageProvider?: 'local' | 's3' | 'azure';

  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateSettingsDto {
  siteName?: string;
  siteDescription?: string;
  logo?: string;
  maintenanceMode?: boolean;
  allowRegistration?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  fromEmail?: string;
  fromName?: string;
  sessionTimeout?: number;
  maxLoginAttempts?: number;
  requireEmailVerification?: boolean;
  requireTwoFactor?: boolean;
  passwordMinLength?: number;
  enableEmailNotifications?: boolean;
  enableSmsNotifications?: boolean;
  enablePushNotifications?: boolean;
  maxFileSize?: number;
  allowedFileTypes?: string;
  storageProvider?: 'local' | 's3' | 'azure';
}

export const settingsService = {
  /**
   * Get all settings (admin only)
   */
  getSettings: async (): Promise<ApiResponse<SystemSettings>> => {
    const response = await api.get<ApiResponse<SystemSettings>>('/settings');
    return response.data;
  },

  /**
   * Get public settings (visible to all users)
   */
  getPublicSettings: async (): Promise<ApiResponse<Partial<SystemSettings>>> => {
    const response = await api.get<ApiResponse<Partial<SystemSettings>>>('/settings/public');
    return response.data;
  },

  /**
   * Update settings (admin only)
   */
  updateSettings: async (data: UpdateSettingsDto): Promise<ApiResponse<SystemSettings>> => {
    const response = await api.put<ApiResponse<SystemSettings>>('/settings', data);
    return response.data;
  },
};
