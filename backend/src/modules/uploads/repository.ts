import { Upload, IUpload } from './schema';
import { FileCategory } from './types';
import mongoose from 'mongoose';

export class UploadRepository {
  /**
   * Create upload record
   */
  async create(data: {
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    s3Key: string;
    s3Bucket: string;
    category: FileCategory;
    description?: string;
    entityType?: 'rfq' | 'bid' | 'contract' | 'dispute';
    entityId?: mongoose.Types.ObjectId;
    uploadedBy: mongoose.Types.ObjectId;
    companyId?: mongoose.Types.ObjectId; // Optional for platform-level uploads (e.g., logo)
  }): Promise<IUpload> {
    const upload = new Upload(data);
    return upload.save();
  }

  /**
   * Find upload by ID
   */
  async findById(id: string): Promise<IUpload | null> {
    return Upload.findOne({
      _id: id,
      deletedAt: null,
    });
  }

  /**
   * Find uploads by company
   */
  async findByCompanyId(
    companyId: string,
    filters?: { category?: FileCategory; entityType?: string; entityId?: string }
  ): Promise<IUpload[]> {
    const query: any = {
      companyId: new mongoose.Types.ObjectId(companyId),
      deletedAt: null,
    };

    if (filters?.category) {
      query.category = filters.category;
    }

    if (filters?.entityType) {
      query.entityType = filters.entityType;
    }

    if (filters?.entityId) {
      query.entityId = new mongoose.Types.ObjectId(filters.entityId);
    }

    return Upload.find(query).sort({ createdAt: -1 });
  }

  /**
   * Find uploads by entity
   */
  async findByEntity(
    entityType: 'rfq' | 'bid' | 'contract' | 'dispute',
    entityId: string
  ): Promise<IUpload[]> {
    return Upload.find({
      entityType,
      entityId: new mongoose.Types.ObjectId(entityId),
      deletedAt: null,
    }).sort({ createdAt: -1 });
  }

  /**
   * Find uploads by user
   */
  async findByUserId(userId: string): Promise<IUpload[]> {
    return Upload.find({
      uploadedBy: new mongoose.Types.ObjectId(userId),
      deletedAt: null,
    }).sort({ createdAt: -1 });
  }

  /**
   * Find upload by S3 key
   */
  async findByS3Key(s3Key: string): Promise<IUpload | null> {
    return Upload.findOne({
      s3Key,
      deletedAt: null,
    });
  }

  /**
   * Soft delete upload
   */
  async softDelete(id: string): Promise<void> {
    await Upload.updateOne(
      { _id: id },
      { deletedAt: new Date() }
    );
  }

  /**
   * Delete upload permanently
   */
  async delete(id: string): Promise<void> {
    await Upload.deleteOne({ _id: id });
  }
}
