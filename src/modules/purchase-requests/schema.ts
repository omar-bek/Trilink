import mongoose, { Schema, Document } from 'mongoose';
import { Status } from '../../types/common';

export enum PurchaseRequestStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export interface IPurchaseRequest extends Document {
  buyerId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    specifications: string;
    estimatedPrice?: number;
  }>;
  budget: number;
  currency: string;
  deliveryLocation: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  requiredDeliveryDate: Date;
  status: PurchaseRequestStatus;
  rfqGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const PurchaseRequestSchema = new Schema<IPurchaseRequest>(
  {
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
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
        estimatedPrice: { type: Number, min: 0 },
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
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    requiredDeliveryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PurchaseRequestStatus),
      default: PurchaseRequestStatus.DRAFT,
      index: true,
    },
    rfqGenerated: {
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
PurchaseRequestSchema.index({ companyId: 1, status: 1 });
PurchaseRequestSchema.index({ buyerId: 1 });
PurchaseRequestSchema.index({ createdAt: -1 });

// Soft delete query helper
PurchaseRequestSchema.query.active = function () {
  return this.where({ deletedAt: null });
};

export const PurchaseRequest = mongoose.model<IPurchaseRequest>(
  'PurchaseRequest',
  PurchaseRequestSchema
);
