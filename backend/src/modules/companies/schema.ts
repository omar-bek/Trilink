import mongoose, { Schema, Document } from 'mongoose';
import { Status } from '../../types/common';

export enum CompanyType {
  BUYER = 'Buyer',
  SUPPLIER = 'Supplier',
  LOGISTICS = 'Logistics',
  CLEARANCE = 'Clearance',
  SERVICE_PROVIDER = 'Service Provider',
  GOVERNMENT = 'Government',
}

export interface ICompany extends Document {
  name: string;
  registrationNumber: string;
  type: CompanyType;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  documents: Array<{
    type: string;
    url: string;
    uploadedAt: Date;
  }>;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(CompanyType),
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
    documents: [
      {
        type: { type: String, required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: Object.values(Status),
      default: Status.PENDING,
      index: true,
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

// Indexes
CompanySchema.index({ registrationNumber: 1 });
CompanySchema.index({ type: 1, status: 1 });
CompanySchema.index({ email: 1 }); // For email lookups
CompanySchema.index({ status: 1, createdAt: -1 }); // Compound index for status filtering with date sorting
CompanySchema.index({ createdAt: -1 }); // For date-based queries

// Soft delete query helper
(CompanySchema.query as any).active = function (this: mongoose.Query<any, any>) {
  return this.where({ deletedAt: null });
};

export const Company = mongoose.model<ICompany>('Company', CompanySchema);
