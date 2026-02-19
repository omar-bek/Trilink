import mongoose, { Schema, Document } from 'mongoose';
import { Status } from '../../types/common';

export enum BidStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export interface IBid extends Document {
  rfqId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  price: number;
  currency: string;
  terms: string;
  deliveryTime: number; // days
  deliveryDate: Date;
  aiScore?: number;
  status: BidStatus;
  isAnonymous: boolean;
  attachments?: Array<{
    type: string;
    url: string;
    uploadedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const BidSchema = new Schema<IBid>(
  {
    rfqId: {
      type: Schema.Types.ObjectId,
      ref: 'RFQ',
      required: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'AED',
    },
    terms: {
      type: String,
      required: true,
    },
    deliveryTime: {
      type: Number,
      required: true,
      min: 1,
    },
    deliveryDate: {
      type: Date,
      required: true,
    },
    aiScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: Object.values(BidStatus),
      default: BidStatus.DRAFT,
      index: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    attachments: [
      {
        type: { type: String, required: true },
        url: { type: String, required: true },
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
BidSchema.index({ rfqId: 1, status: 1 });
BidSchema.index({ companyId: 1 });
BidSchema.index({ providerId: 1 });
BidSchema.index({ aiScore: -1 });

// Soft delete query helper
BidSchema.query.active = function () {
  return this.where({ deletedAt: null });
};

export const Bid = mongoose.model<IBid>('Bid', BidSchema);
