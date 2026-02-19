import mongoose, { Schema, Document } from 'mongoose';

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
  paymentTerms: string; // Payment terms and conditions (text description)
  paymentSchedule?: Array<{
    milestone: string; // e.g., "Advance Payment", "Upon Delivery", "Final Payment"
    amount?: number; // Payment amount
    percentage?: number; // Payment percentage (0-100)
    dueDate?: Date; // When payment is due
    description?: string; // Additional description
  }>; // Payment schedule with amounts and percentages (must total 100%)
  deliveryTime: number; // days
  deliveryDate: Date;
  validity: Date; // Bid validity expiration date
  items?: Array<{
    name: string;
    quantity: number;
    unit: string;
    price: number; // Price per item
  }>;
  aiScore?: number;
  aiScoreMetadata?: {
    totalScore: number;
    breakdown: {
      price: { score: number; maxScore: number; weight: number; explanation: string; confidence: string; risk: string };
      delivery: { score: number; maxScore: number; weight: number; explanation: string; confidence: string; risk: string };
      terms: { score: number; maxScore: number; weight: number; explanation: string; confidence: string; risk: string };
      history: { score: number; maxScore: number; weight: number; explanation: string; confidence: string; risk: string };
    };
    overallConfidence: string;
    overallRisk: string;
    recommendation: string;
    timestamp: Date;
    modelVersion?: string;
  };
  status: BidStatus;
  anonymousBidder: boolean; // Flag to hide bidder identity
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
    paymentTerms: {
      type: String,
      required: true,
    },
    paymentSchedule: [
      {
        milestone: { type: String, required: true },
        amount: { type: Number, min: 0 },
        percentage: { type: Number, min: 0, max: 100 },
        dueDate: { type: Date },
        description: { type: String },
      },
    ],
    deliveryTime: {
      type: Number,
      required: true,
      min: 1,
    },
    deliveryDate: {
      type: Date,
      required: true,
    },
    validity: {
      type: Date,
      required: true,
      index: true,
    },
    items: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unit: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    aiScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    aiScoreMetadata: {
      type: {
        totalScore: Number,
        breakdown: {
          price: {
            score: Number,
            maxScore: Number,
            weight: Number,
            explanation: String,
            confidence: String,
            risk: String,
          },
          delivery: {
            score: Number,
            maxScore: Number,
            weight: Number,
            explanation: String,
            confidence: String,
            risk: String,
          },
          terms: {
            score: Number,
            maxScore: Number,
            weight: Number,
            explanation: String,
            confidence: String,
            risk: String,
          },
          history: {
            score: Number,
            maxScore: Number,
            weight: Number,
            explanation: String,
            confidence: String,
            risk: String,
          },
        },
        overallConfidence: String,
        overallRisk: String,
        recommendation: String,
        timestamp: Date,
        modelVersion: String,
      },
    },
    status: {
      type: String,
      enum: Object.values(BidStatus),
      default: BidStatus.DRAFT,
      index: true,
    },
    anonymousBidder: {
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
BidSchema.index({ rfqId: 1, companyId: 1 }); // Unique bid per RFQ per company
BidSchema.index({ validity: 1 }); // Index for validity checks
BidSchema.index({ createdAt: -1 }); // For date-based queries
BidSchema.index({ companyId: 1, status: 1, createdAt: -1 }); // Company bids filtered by status, sorted by date
BidSchema.index({ rfqId: 1, createdAt: -1 }); // RFQ bids sorted by creation date
BidSchema.index({ providerId: 1, status: 1, createdAt: -1 }); // Provider bids filtered by status, sorted by date

// Soft delete query helper
(BidSchema.query as any).active = function (this: mongoose.Query<any, any>) {
  return this.where({ deletedAt: null });
};

export const Bid = mongoose.model<IBid>('Bid', BidSchema);
