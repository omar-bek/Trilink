import mongoose, { Schema, Document } from 'mongoose';
import { Role, Permission } from '../../config/rbac';
import { Status } from '../../types/common';

export interface IUser extends Document {
  email: string;
  password: string;
  role: Role;
  companyId: mongoose.Types.ObjectId;
  status: Status;
  firstName?: string;
  lastName?: string;
  phone?: string;
  lastLogin?: Date;
  customPermissions?: Permission[]; // Custom permissions that override/add to role permissions
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: Object.values(Role),
      required: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(Status),
      default: Status.ACTIVE,
      index: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    lastLogin: {
      type: Date,
    },
    customPermissions: {
      type: [String],
      enum: Object.values(Permission),
      default: [],
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for company isolation and common queries
UserSchema.index({ companyId: 1, email: 1 });
UserSchema.index({ companyId: 1, status: 1 });
UserSchema.index({ companyId: 1, createdAt: -1 }); // Company users sorted by creation date
UserSchema.index({ companyId: 1, status: 1, createdAt: -1 }); // Company users filtered by status, sorted by date
UserSchema.index({ createdAt: -1 }); // For date-based queries

// Soft delete query helper
(UserSchema.query as any).active = function (this: mongoose.Query<any, any>) {
  return this.where({ deletedAt: null });
};

export const User = mongoose.model<IUser>('User', UserSchema);
