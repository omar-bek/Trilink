import mongoose, { Schema, Document } from 'mongoose';

export enum DisputeStatus {
  OPEN = 'open', // Initial status when dispute is created
  UNDER_REVIEW = 'under_review', // Dispute is being reviewed
  ESCALATED = 'escalated', // Escalated to government
  RESOLVED = 'resolved', // Resolved by government (final state)
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
  assignedTo?: mongoose.Types.ObjectId; // Assigned government user (required when escalated)
  assignedAt?: Date; // When dispute was assigned
  assignedBy?: mongoose.Types.ObjectId; // Who assigned the dispute
  dueDate?: Date; // SLA due date for resolution
  responseTime?: number; // Response time in hours (calculated)
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
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    assignedAt: {
      type: Date,
      index: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    dueDate: {
      type: Date,
      index: true,
    },
    responseTime: {
      type: Number, // Response time in hours
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
DisputeSchema.index({ assignedTo: 1, status: 1 });
DisputeSchema.index({ dueDate: 1, status: 1 }); // For SLA tracking queries
DisputeSchema.index({ assignedAt: 1 }); // For assignment tracking
DisputeSchema.index({ createdAt: -1 }); // For date-based queries
DisputeSchema.index({ companyId: 1, status: 1, createdAt: -1 }); // Company disputes filtered by status, sorted by date
DisputeSchema.index({ contractId: 1, status: 1 }); // Contract disputes filtered by status
DisputeSchema.index({ raisedBy: 1, status: 1, createdAt: -1 }); // User disputes filtered by status, sorted by date

// Soft delete query helper
(DisputeSchema.query as any).active = function (this: mongoose.Query<any, any>) {
  return this.where({ deletedAt: null });
};

export const Dispute = mongoose.model<IDispute>('Dispute', DisputeSchema);
