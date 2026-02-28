import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  // General Settings
  siteName: string;
  siteDescription: string;
  logo?: string; // URL to logo image
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
  sessionTimeout?: number; // in minutes
  maxLoginAttempts?: number;
  requireEmailVerification?: boolean;
  requireTwoFactor?: boolean;
  passwordMinLength?: number;

  // Notification Settings
  enableEmailNotifications?: boolean;
  enableSmsNotifications?: boolean;
  enablePushNotifications?: boolean;

  // Storage Settings
  maxFileSize?: number; // in MB
  allowedFileTypes?: string; // comma-separated
  storageProvider?: 'local' | 's3' | 'azure';

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    siteName: {
      type: String,
      required: true,
      default: 'TriLink Platform',
      trim: true,
    },
    siteDescription: {
      type: String,
      default: 'Government Procurement Platform',
      trim: true,
    },
    logo: {
      type: String,
      trim: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    allowRegistration: {
      type: Boolean,
      default: true,
    },
    smtpHost: {
      type: String,
      trim: true,
    },
    smtpPort: {
      type: Number,
      min: 1,
      max: 65535,
    },
    smtpUser: {
      type: String,
      trim: true,
    },
    smtpPassword: {
      type: String,
    },
    fromEmail: {
      type: String,
      trim: true,
    },
    fromName: {
      type: String,
      trim: true,
    },
    sessionTimeout: {
      type: Number,
      default: 60,
      min: 5,
      max: 1440,
    },
    maxLoginAttempts: {
      type: Number,
      default: 5,
      min: 3,
      max: 10,
    },
    requireEmailVerification: {
      type: Boolean,
      default: true,
    },
    requireTwoFactor: {
      type: Boolean,
      default: false,
    },
    passwordMinLength: {
      type: Number,
      default: 8,
      min: 6,
      max: 32,
    },
    enableEmailNotifications: {
      type: Boolean,
      default: true,
    },
    enableSmsNotifications: {
      type: Boolean,
      default: false,
    },
    enablePushNotifications: {
      type: Boolean,
      default: true,
    },
    maxFileSize: {
      type: Number,
      default: 10,
      min: 1,
    },
    allowedFileTypes: {
      type: String,
      default: 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png',
      trim: true,
    },
    storageProvider: {
      type: String,
      enum: ['local', 's3', 'azure'],
      default: 'local',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
SettingsSchema.index({ _id: 1 }, { unique: true });

export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);
