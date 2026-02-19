import mongoose, { Schema, Document } from 'mongoose';
import { CompanyType } from '../companies/schema';
import { Role } from '../../config/rbac';

export enum RFQType {
  SUPPLIER = 'Supplier',
  LOGISTICS = 'Logistics',
  CLEARANCE = 'Clearance',
  SERVICE_PROVIDER = 'Service Provider',
}

export enum RFQStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export interface IRFQ extends Document {
  rfqNumber?: string; // Auto-generated RFQ number
  purchaseRequestId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  type: RFQType;
  targetRole: Role; // Target role for the RFQ (Supplier, Logistics, Clearance, Service Provider)
  targetCompanyType: CompanyType; // Kept for backward compatibility
  targetCompanyIds?: mongoose.Types.ObjectId[]; // Specific company IDs that should receive this RFQ (optional)
  title: string;
  description: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    specifications: string;
  }>;
  budget: number;
  currency: string;
  deliveryLocation: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  requiredDeliveryDate: Date;
  deadline: Date;
  status: RFQStatus;
  anonymousBuyer: boolean; // Flag to hide buyer identity
  attachments?: Array<{
    uploadId: mongoose.Types.ObjectId; // Reference to Upload document
    type: string; // attachment type
    uploadedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const RFQSchema = new Schema<IRFQ>(
  {
    rfqNumber: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
      trim: true,
    },
    purchaseRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'PurchaseRequest',
      required: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(RFQType),
      required: true,
      index: true,
    },
    targetRole: {
      type: String,
      enum: Object.values(Role),
      required: true,
      index: true,
    },
    targetCompanyType: {
      type: String,
      enum: Object.values(CompanyType),
      required: true,
      index: true,
    },
    targetCompanyIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Company',
      default: [],
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    items: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unit: { type: String, required: true },
        specifications: { type: String, required: true },
      },
    ],
    budget: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'AED',
    },
    deliveryLocation: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
    requiredDeliveryDate: {
      type: Date,
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(RFQStatus),
      default: RFQStatus.OPEN,
      index: true,
    },
    anonymousBuyer: {
      type: Boolean,
      default: false,
    },
    attachments: [
      {
        uploadId: { type: Schema.Types.ObjectId, ref: 'Upload', required: true },
        type: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
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
RFQSchema.index({ companyId: 1, status: 1 });
RFQSchema.index({ purchaseRequestId: 1 });
RFQSchema.index({ type: 1, status: 1 });
RFQSchema.index({ targetRole: 1, status: 1 }); // Index for role-targeted queries
RFQSchema.index({ deadline: 1 });
RFQSchema.index({ createdAt: -1 }); // For date-based queries
RFQSchema.index({ companyId: 1, status: 1, createdAt: -1 }); // Company RFQs filtered by status, sorted by date
RFQSchema.index({ purchaseRequestId: 1, status: 1 }); // Purchase request RFQs filtered by status
RFQSchema.index({ targetRole: 1, status: 1, createdAt: -1 }); // Role-targeted RFQs filtered by status, sorted by date
RFQSchema.index({ targetCompanyIds: 1, status: 1 }); // Index for company-specific RFQ queries

// Soft delete query helper
(RFQSchema.query as any).active = function (this: mongoose.Query<any, any>) {
  return this.where({ deletedAt: null });
};

export const RFQ = mongoose.model<IRFQ>('RFQ', RFQSchema);
