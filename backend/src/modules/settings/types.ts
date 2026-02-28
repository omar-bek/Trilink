export interface UpdateSettingsDto {
  // General Settings
  siteName?: string;
  siteDescription?: string;
  logo?: string;
  maintenanceMode?: boolean;
  allowRegistration?: boolean;

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
}
