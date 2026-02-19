import mongoose, { Schema, Document } from 'mongoose';

export interface IContractVersion extends Document {
  contractId: mongoose.Types.ObjectId;
  version: number; // Version number (1, 2, 3, etc.)
  
  // Complete contract snapshot at this version
  snapshot: {
    purchaseRequestId: mongoose.Types.ObjectId;
    buyerCompanyId: mongoose.Types.ObjectId;
    parties: Array<{
      companyId: mongoose.Types.ObjectId;
      userId: mongoose.Types.ObjectId;
      role: string;
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
    terms: string;
    startDate: Date;
    endDate: Date;
    status: string;
  };
  
  // Signatures at this version (immutable)
  signatures: Array<{
    partyId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    signedAt: Date;
    signature: string;
    signatureHash: string;
    certificate?: string;
    algorithm?: string;
    verified: boolean;
  }>;
  
  // Metadata
  createdBy?: {
    userId: mongoose.Types.ObjectId;
    companyId: mongoose.Types.ObjectId;
  };
  reason?: string; // Reason for version creation (e.g., "Initial version", "Amendment applied", "Contract signed")
  amendmentId?: mongoose.Types.ObjectId; // Link to amendment if created by amendment
  
  createdAt: Date;
}

const ContractVersionSchema = new Schema<IContractVersion>(
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
    snapshot: {
      purchaseRequestId: { type: Schema.Types.ObjectId, ref: 'PurchaseRequest', required: true },
      buyerCompanyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
      parties: [
        {
          companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
          userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
          role: { type: String, required: true },
          bidId: { type: Schema.Types.ObjectId, ref: 'Bid' },
        },
      ],
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
          status: { type: String, default: 'pending' },
        },
      ],
      terms: { type: String, required: true },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      status: { type: String, required: true },
    },
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
    createdBy: {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
    },
    reason: { type: String },
    amendmentId: { type: Schema.Types.ObjectId, ref: 'ContractAmendment' },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
ContractVersionSchema.index({ contractId: 1, version: 1 }, { unique: true });
ContractVersionSchema.index({ contractId: 1, createdAt: -1 });

export const ContractVersion = mongoose.model<IContractVersion>('ContractVersion', ContractVersionSchema);
