import mongoose, { Schema, Document } from 'mongoose';


export enum ContractStatus {
  DRAFT = 'draft',
  PENDING_SIGNATURES = 'pending_signatures', // Waiting for all parties to sign
  SIGNED = 'signed', // All parties have signed
  ACTIVE = 'active', // Contract is active and in effect
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
    signature: string; // PKI digital signature (base64)
    signatureHash: string; // SHA-256 hash of contract content
    certificate?: string; // X.509 certificate (base64)
    algorithm?: string; // Signature algorithm (e.g., 'RSA-SHA256')
    verified: boolean; // Whether signature has been verified
  }>;
  terms: string;
  startDate: Date;
  endDate: Date;
  status: ContractStatus;
  version: number; // Contract version (increments with each amendment)
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
        signatureHash: { type: String, required: true },
        certificate: { type: String },
        algorithm: { type: String, default: 'RSA-SHA256' },
        verified: { type: Boolean, default: false },
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
    version: {
      type: Number,
      default: 1,
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
ContractSchema.index({ 'amounts.total': 1 });
ContractSchema.index({ startDate: 1, endDate: 1 });
ContractSchema.index({ createdAt: -1 });
ContractSchema.index({ buyerCompanyId: 1, status: 1, createdAt: -1 }); // Buyer contracts filtered by status, sorted by date
ContractSchema.index({ purchaseRequestId: 1, status: 1 }); // Purchase request contracts filtered by status

// Text search index for terms and other searchable fields
ContractSchema.index({ terms: 'text' });

// Soft delete query helper
(ContractSchema.query as any).active = function (this: mongoose.Query<any, any>) {
  return this.where({ deletedAt: null });
};

export const Contract = mongoose.model<IContract>('Contract', ContractSchema);
