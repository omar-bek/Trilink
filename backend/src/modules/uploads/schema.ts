import mongoose, { Document, Schema } from 'mongoose';
import { FileCategory } from './types';

export interface IUpload extends Document {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  s3Key: string;
  s3Bucket: string;
  category: FileCategory;
  description?: string;
  entityType?: 'rfq' | 'bid' | 'contract' | 'dispute'; // Linked entity type
  entityId?: mongoose.Types.ObjectId; // Linked entity ID
  uploadedBy: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId; // Optional for platform-level uploads (e.g., logo)
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const uploadSchema = new Schema<IUpload>(
  {
    fileName: {
      type: String,
      required: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    s3Key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    s3Bucket: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: Object.values(FileCategory),
      required: true,
      index: true,
    },
    description: {
      type: String,
    },
    entityType: {
      type: String,
      enum: ['rfq', 'bid', 'contract', 'dispute'],
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: false, // Optional for platform-level uploads (e.g., logo)
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

// Compound indexes
uploadSchema.index({ companyId: 1, category: 1 });
uploadSchema.index({ uploadedBy: 1, createdAt: -1 });
uploadSchema.index({ companyId: 1, deletedAt: 1 });
uploadSchema.index({ entityType: 1, entityId: 1 }); // For entity-based queries
uploadSchema.index({ companyId: 1, entityType: 1, entityId: 1 }); // Company + entity queries

export const Upload = mongoose.model<IUpload>('Upload', uploadSchema);
