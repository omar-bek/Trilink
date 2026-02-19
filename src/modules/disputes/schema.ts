import mongoose, { Schema, Document } from 'mongoose';
import { Status } from '../../types/common';

export enum DisputeStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
  CLOSED = 'closed',
}

export interface IDispute extends Document {
  contractId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  raisedBy: mongoose.Types.ObjectId;
  againstCompanyId: mongoose.Types.ObjectId;
  type: string; // Quality, Delivery, Payment, etc.
  description: string;
  attachments: Array<{
    type: string;
    url: string;
    uploadedAt: Date;
  }>;
  status: DisputeStatus;
  resolution?: string;
  escalatedToGovernment: boolean;
  governmentNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const DisputeSchema = new Schema<IDispute>(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      ref: 'Contract',
      required: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    raisedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    againstCompanyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    attachments: [
      {
        type: { type: String, required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: Object.values(DisputeStatus),
      default: DisputeStatus.OPEN,
      index: true,
    },
    resolution: {
      type: String,
    },
    escalatedToGovernment: {
      type: Boolean,
      default: false,
      index: true,
    },
    governmentNotes: {
      type: String,
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
DisputeSchema.index({ companyId: 1, status: 1 });
DisputeSchema.index({ contractId: 1 });
DisputeSchema.index({ escalatedToGovernment: 1 });

// Soft delete query helper
DisputeSchema.query.active = function () {
  return this.where({ deletedAt: null });
};

export const Dispute = mongoose.model<IDispute>('Dispute', DisputeSchema);
