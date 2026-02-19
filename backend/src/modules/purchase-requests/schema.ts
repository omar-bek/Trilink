import mongoose, { Schema, Document } from 'mongoose';

export enum PurchaseRequestStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
}

export interface IPurchaseRequest extends Document {
  buyerId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId; // Required: Main category
  subCategoryId?: mongoose.Types.ObjectId; // Optional: Sub-category
  title: string;
  description: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    specifications: string;
    estimatedPrice?: number;
  }>;
  budget: number;
  currency: string;
  deliveryLocation: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  requiredDeliveryDate: Date;
  status: PurchaseRequestStatus;
  approverId?: mongoose.Types.ObjectId;
  approvalHistory: Array<{
    status: PurchaseRequestStatus;
    approverId?: mongoose.Types.ObjectId;
    approverName?: string;
    notes?: string;
    timestamp: Date;
  }>;
  rfqGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const PurchaseRequestSchema = new Schema<IPurchaseRequest>(
  {
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    subCategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    items: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unit: { type: String, required: true },
        specifications: { type: String, required: true },
        estimatedPrice: { type: Number, min: 0 },
      },
    ],
    budget: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'AED',
    },
    deliveryLocation: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      zipCode: { type: String, required: true },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    requiredDeliveryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PurchaseRequestStatus),
      default: PurchaseRequestStatus.DRAFT,
      index: true,
    },
    approverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    approvalHistory: [
      {
        status: {
          type: String,
          enum: Object.values(PurchaseRequestStatus),
          required: true,
        },
        approverId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        approverName: {
          type: String,
        },
        notes: {
          type: String,
        },
        timestamp: {
          type: Date,
          default: Date.now,
          required: true,
        },
      },
    ],
    rfqGenerated: {
      type: Boolean,
      default: false,
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
PurchaseRequestSchema.index({ companyId: 1, status: 1 });
PurchaseRequestSchema.index({ buyerId: 1 });
PurchaseRequestSchema.index({ createdAt: -1 });
PurchaseRequestSchema.index({ companyId: 1, status: 1, createdAt: -1 }); // Company purchase requests filtered by status, sorted by date
PurchaseRequestSchema.index({ buyerId: 1, status: 1, createdAt: -1 }); // Buyer purchase requests filtered by status, sorted by date
PurchaseRequestSchema.index({ approverId: 1, status: 1 }); // Approver purchase requests filtered by status

// Category-based routing indexes for performance
PurchaseRequestSchema.index({ categoryId: 1, status: 1 }); // Find PRs by category and status
PurchaseRequestSchema.index({ subCategoryId: 1, status: 1 }); // Find PRs by sub-category and status
PurchaseRequestSchema.index({ categoryId: 1, subCategoryId: 1, status: 1 }); // Compound index for category routing

// Soft delete query helper
(PurchaseRequestSchema.query as any).active = function (this: mongoose.Query<any, any>) {
  return this.where({ deletedAt: null });
};

export const PurchaseRequest = mongoose.model<IPurchaseRequest>(
  'PurchaseRequest',
  PurchaseRequestSchema
);
