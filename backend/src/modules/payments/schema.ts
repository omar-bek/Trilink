import mongoose, { Schema, Document } from 'mongoose';

export enum PaymentStatus {
  PENDING_APPROVAL = 'pending_approval', // Waiting for buyer approval
  APPROVED = 'approved', // Buyer approved, ready for processing
  REJECTED = 'rejected', // Buyer rejected
  PROCESSING = 'processing', // Payment being processed
  COMPLETED = 'completed', // Payment completed
  FAILED = 'failed', // Payment failed
  CANCELLED = 'cancelled', // Payment cancelled
  REFUNDED = 'refunded', // Payment refunded
}

export interface IPayment extends Document {
  contractId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId; // Buyer company (payer)
  recipientCompanyId: mongoose.Types.ObjectId; // Payee company (Supplier, Logistics, etc.)
  buyerId: mongoose.Types.ObjectId; // Buyer user who needs to approve
  milestone: string;
  amount: number; // Subtotal (excluding VAT)
  vatAmount?: number; // VAT amount (UAE 5%)
  vatRate?: number; // VAT rate (default 0.05 for UAE)
  totalAmount: number; // Total amount including VAT
  currency: string;
  dueDate: Date;
  paidDate?: Date;
  status: PaymentStatus;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId; // Buyer user who approved
  rejectedAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId; // Buyer user who rejected
  rejectionReason?: string;
  failedAt?: Date; // When payment failed
  failureReason?: string; // Reason for payment failure (from gateway or system)
  retryCount?: number; // Number of retry attempts
  lastRetryAt?: Date; // Last retry attempt timestamp
  paymentMethod?: string;
  transactionId?: string;
  gateway?: string; // 'stripe' | 'paypal'
  gatewayIntentId?: string; // Payment intent/order ID from gateway
  gatewayClientSecret?: string; // Client secret for Stripe
  gatewayRedirectUrl?: string; // Redirect URL for PayPal
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
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
    vatAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    vatRate: {
      type: Number,
      default: 0.05, // UAE VAT rate 5%
      min: 0,
      max: 1,
    },
    totalAmount: {
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
      default: PaymentStatus.PENDING_APPROVAL,
      index: true,
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: {
      type: Date,
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
    },
    failedAt: {
      type: Date,
    },
    failureReason: {
      type: String,
    },
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastRetryAt: {
      type: Date,
    },
    paymentMethod: {
      type: String,
    },
    transactionId: {
      type: String,
      index: true,
    },
    gateway: {
      type: String,
      enum: ['stripe', 'paypal'],
      index: true,
    },
    gatewayIntentId: {
      type: String,
      index: true,
    },
    gatewayClientSecret: {
      type: String,
    },
    gatewayRedirectUrl: {
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
PaymentSchema.index({ createdAt: -1 }); // For date-based queries
PaymentSchema.index({ companyId: 1, status: 1, createdAt: -1 }); // Company payments filtered by status, sorted by date
PaymentSchema.index({ contractId: 1, status: 1 }); // Contract payments filtered by status
PaymentSchema.index({ buyerId: 1, status: 1 }); // Buyer payments filtered by status
PaymentSchema.index({ recipientCompanyId: 1, status: 1, createdAt: -1 }); // Recipient payments filtered by status, sorted by date

// Soft delete query helper
(PaymentSchema.query as any).active = function (this: mongoose.Query<any, any>) {
  return this.where({ deletedAt: null });
};

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
