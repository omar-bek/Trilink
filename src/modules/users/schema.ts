import mongoose, { Schema, Document } from 'mongoose';
import { Role } from '../../config/rbac';
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
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for company isolation
UserSchema.index({ companyId: 1, email: 1 });
UserSchema.index({ companyId: 1, status: 1 });

// Soft delete query helper
UserSchema.query.active = function () {
  return this.where({ deletedAt: null });
};

export const User = mongoose.model<IUser>('User', UserSchema);
