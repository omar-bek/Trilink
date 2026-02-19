import mongoose, { Schema, Document } from 'mongoose';
import { Status } from '../../types/common';
import { CompanyType } from '../companies/schema';

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
  purchaseRequestId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  type: RFQType;
  targetCompanyType: CompanyType;
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
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const RFQSchema = new Schema<IRFQ>(
  {
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
    targetCompanyType: {
      type: String,
      enum: Object.values(CompanyType),
      required: true,
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
    isAnonymous: {
      type: Boolean,
      default: false,
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
RFQSchema.index({ companyId: 1, status: 1 });
RFQSchema.index({ purchaseRequestId: 1 });
RFQSchema.index({ type: 1, status: 1 });
RFQSchema.index({ deadline: 1 });

// Soft delete query helper
RFQSchema.query.active = function () {
  return this.where({ deletedAt: null });
};

export const RFQ = mongoose.model<IRFQ>('RFQ', RFQSchema);
