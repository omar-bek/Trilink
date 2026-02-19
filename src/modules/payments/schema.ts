import mongoose, { Schema, Document } from 'mongoose';
import { Status } from '../../types/common';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export interface IPayment extends Document {
  contractId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  recipientCompanyId: mongoose.Types.ObjectId;
  milestone: string;
  amount: number;
  currency: string;
  dueDate: Date;
  paidDate?: Date;
  status: PaymentStatus;
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const PaymentSchema = new Schema<IPayment>(
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
    recipientCompanyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    milestone: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'AED',
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    paidDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },
    paymentMethod: {
      type: String,
    },
    transactionId: {
      type: String,
    },
    notes: {
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
PaymentSchema.index({ companyId: 1, status: 1 });
PaymentSchema.index({ contractId: 1 });
PaymentSchema.index({ recipientCompanyId: 1 });
PaymentSchema.index({ dueDate: 1 });

// Soft delete query helper
PaymentSchema.query.active = function () {
  return this.where({ deletedAt: null });
};

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
