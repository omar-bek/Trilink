import mongoose, { Schema, Document } from 'mongoose';

export enum AmendmentStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active', // Amendment is active and applied to contract
}

export interface IContractAmendment extends Document {
  contractId: mongoose.Types.ObjectId;
  version: number; // Amendment version number (1, 2, 3, etc.)
  amendmentNumber: string; // Human-readable amendment number (e.g., "AMEND-001")
  
  // Amendment details
  reason: string; // Reason for amendment
  description: string; // Detailed description of changes
  
  // Changed fields (only fields that are being amended)
  changes: {
    terms?: string;
    amounts?: {
      total?: number;
      currency?: string;
      breakdown?: Array<{
        partyId: mongoose.Types.ObjectId;
        amount: number;
        description: string;
      }>;
    };
    paymentSchedule?: Array<{
      milestone: string;
      amount: number;
      dueDate: Date;
      status: string;
    }>;
    startDate?: Date;
    endDate?: Date;
  };
  
  // Original contract snapshot (for reference)
  originalContract: {
    terms: string;
    amounts: {
      total: number;
      currency: string;
      breakdown: Array<{
        partyId: mongoose.Types.ObjectId;
        amount: number;
        description: string;
      }>;
    };
    paymentSchedule: Array<{
      milestone: string;
      amount: number;
      dueDate: Date;
      status: string;
    }>;
    startDate: Date;
    endDate: Date;
  };
  
  // Approval tracking
  approvals: Array<{
    partyId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    approved: boolean; // true for approval, false for rejection
    comments?: string;
    approvedAt?: Date;
  }>;
  
  // Amendment status
  status: AmendmentStatus;
  
  // Created by
  createdBy: {
    userId: mongoose.Types.ObjectId;
    companyId: mongoose.Types.ObjectId;
  };
  
  // Applied to contract
  appliedAt?: Date;
  appliedBy?: mongoose.Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}

const ContractAmendmentSchema = new Schema<IContractAmendment>(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      ref: 'Contract',
      required: true,
      index: true,
    },
    version: {
      type: Number,
      required: true,
      index: true,
    },
    amendmentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    changes: {
      terms: { type: String },
      amounts: {
        total: { type: Number, min: 0 },
        currency: { type: String },
        breakdown: [
          {
            partyId: { type: Schema.Types.ObjectId, required: true },
            amount: { type: Number, required: true, min: 0 },
            description: { type: String, required: true },
          },
        ],
      },
      paymentSchedule: [
        {
          milestone: { type: String, required: true },
          amount: { type: Number, required: true, min: 0 },
          dueDate: { type: Date, required: true },
          status: { type: String, default: 'pending' },
        },
      ],
      startDate: { type: Date },
      endDate: { type: Date },
    },
    originalContract: {
      terms: { type: String, required: true },
      amounts: {
        total: { type: Number, required: true },
        currency: { type: String, required: true },
        breakdown: [
          {
            partyId: { type: Schema.Types.ObjectId, required: true },
            amount: { type: Number, required: true },
            description: { type: String, required: true },
          },
        ],
      },
      paymentSchedule: [
        {
          milestone: { type: String, required: true },
          amount: { type: Number, required: true },
          dueDate: { type: Date, required: true },
          status: { type: String, required: true },
        },
      ],
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
    approvals: [
      {
        partyId: { type: Schema.Types.ObjectId, required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        approved: { type: Boolean, required: true },
        comments: { type: String },
        approvedAt: { type: Date },
      },
    ],
    status: {
      type: String,
      enum: Object.values(AmendmentStatus),
      default: AmendmentStatus.DRAFT,
      index: true,
    },
    createdBy: {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    },
    appliedAt: { type: Date },
    appliedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

// Indexes
ContractAmendmentSchema.index({ contractId: 1, version: 1 });
ContractAmendmentSchema.index({ contractId: 1, status: 1 });
ContractAmendmentSchema.index({ status: 1 });

export const ContractAmendment = mongoose.model<IContractAmendment>(
  'ContractAmendment',
  ContractAmendmentSchema
);
