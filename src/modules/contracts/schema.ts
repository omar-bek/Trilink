import mongoose, { Schema, Document } from 'mongoose';
import { Status } from '../../types/common';

export enum ContractStatus {
  DRAFT = 'draft',
  PENDING_SIGNATURE = 'pending_signature',
  SIGNED = 'signed',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  TERMINATED = 'terminated',
  CANCELLED = 'cancelled',
}

export interface IContract extends Document {
  purchaseRequestId: mongoose.Types.ObjectId;
  buyerCompanyId: mongoose.Types.ObjectId;
  parties: Array<{
    companyId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    role: string; // Supplier, Logistics, Clearance, Service Provider
    bidId?: mongoose.Types.ObjectId;
  }>;
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
  signatures: Array<{
    partyId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    signedAt: Date;
    signature: string; // Digital signature hash
  }>;
  terms: string;
  startDate: Date;
  endDate: Date;
  status: ContractStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const ContractSchema = new Schema<IContract>(
  {
    purchaseRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'PurchaseRequest',
      required: true,
      index: true,
    },
    buyerCompanyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    parties: [
      {
        companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, required: true },
        bidId: { type: Schema.Types.ObjectId, ref: 'Bid' },
      },
    ],
    amounts: {
      total: { type: Number, required: true, min: 0 },
      currency: { type: String, required: true, default: 'AED' },
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
    signatures: [
      {
        partyId: { type: Schema.Types.ObjectId, required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        signedAt: { type: Date, required: true },
        signature: { type: String, required: true },
      },
    ],
    terms: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ContractStatus),
      default: ContractStatus.DRAFT,
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
ContractSchema.index({ buyerCompanyId: 1, status: 1 });
ContractSchema.index({ purchaseRequestId: 1 });
ContractSchema.index({ 'parties.companyId': 1 });

// Soft delete query helper
ContractSchema.query.active = function () {
  return this.where({ deletedAt: null });
};

export const Contract = mongoose.model<IContract>('Contract', ContractSchema);
