import { UploadRepository } from './repository';
import { S3Service } from './s3.service';
import { UploadFileResponse, FileCategory } from './types';
import { AppError } from '../../middlewares/error.middleware';
import { IUpload } from './schema';
import mongoose from 'mongoose';
import { logger } from '../../utils/logger';

export class UploadService {
  private repository: UploadRepository;
  private s3Service: S3Service;

  constructor() {
    this.repository = new UploadRepository();
    this.s3Service = new S3Service();
  }

  /**
   * Upload file and create record
   */
  async uploadFile(
    file: Express.Multer.File,
    category: FileCategory,
    userId: string,
    companyId: string,
    description?: string,
    entityType?: 'rfq' | 'bid' | 'contract' | 'dispute',
    entityId?: string
  ): Promise<UploadFileResponse> {
    try {
      // Upload to S3
      const { key, bucket } = await this.s3Service.uploadFile(
        file,
        category,
        companyId,
        userId
      );

      // Generate presigned URL (valid for 1 hour)
      const url = await this.s3Service.getPresignedUrl(key, 3600);

    // Create database record
    // For platform logo, companyId might be 'system' string, handle it properly
    const companyObjectId = companyId === 'system' 
      ? undefined 
      : new mongoose.Types.ObjectId(companyId);
    
    const upload = await this.repository.create({
      fileName: file.filename || key.split('/').pop() || 'unknown',
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url,
      s3Key: key,
      s3Bucket: bucket,
      category,
      description,
      entityType,
      entityId: entityId ? new mongoose.Types.ObjectId(entityId) : undefined,
      uploadedBy: new mongoose.Types.ObjectId(userId),
      companyId: companyObjectId,
    });

      return this.toUploadResponse(upload);
    } catch (error: any) {
      logger.error('Upload service error:', error);
      throw error; // Re-throw to be handled by controller
    }
  }

  /**
   * Get upload by ID and generate fresh presigned URL
   */
  async getUploadById(id: string, requesterCompanyId?: string): Promise<UploadFileResponse> {
    const upload = await this.repository.findById(id);
    if (!upload) {
      throw new AppError('Upload not found', 404);
    }

    // Enforce company isolation (skip for platform-level uploads without companyId)
    if (requesterCompanyId && upload.companyId && upload.companyId.toString() !== requesterCompanyId) {
      throw new AppError('Access denied: Upload belongs to different company', 403);
    }

    // Generate fresh presigned URL
    const freshUrl = await this.s3Service.getPresignedUrl(upload.s3Key, 3600);

    // Update URL in response
    const response = this.toUploadResponse(upload);
    response.url = freshUrl;

    return response;
  }

  /**
   * Get uploads by company
   */
  async getUploadsByCompany(
    companyId: string,
    filters?: { category?: FileCategory; entityType?: string; entityId?: string }
  ): Promise<UploadFileResponse[]> {
    const uploads = await this.repository.findByCompanyId(companyId, filters);
    
    // Generate fresh presigned URLs for all uploads
    const uploadsWithUrls = await Promise.all(
      uploads.map(async (upload) => {
        const freshUrl = await this.s3Service.getPresignedUrl(upload.s3Key, 3600);
        const response = this.toUploadResponse(upload);
        response.url = freshUrl;
        return response;
      })
    );

    return uploadsWithUrls;
  }

  /**
   * Get uploads by entity
   */
  async getUploadsByEntity(
    entityType: 'rfq' | 'bid' | 'contract' | 'dispute',
    entityId: string,
    requesterCompanyId?: string
  ): Promise<UploadFileResponse[]> {
    const uploads = await this.repository.findByEntity(entityType, entityId);
    
    // Enforce company isolation
    if (requesterCompanyId) {
      const filtered = uploads.filter(
        (upload) => upload.companyId && upload.companyId.toString() === requesterCompanyId
      );
      
      const uploadsWithUrls = await Promise.all(
        filtered.map(async (upload) => {
          const freshUrl = await this.s3Service.getPresignedUrl(upload.s3Key, 3600);
          const response = this.toUploadResponse(upload);
          response.url = freshUrl;
          return response;
        })
      );
      
      return uploadsWithUrls;
    }
    
    // Admin/Government can see all
    const uploadsWithUrls = await Promise.all(
      uploads.map(async (upload) => {
        const freshUrl = await this.s3Service.getPresignedUrl(upload.s3Key, 3600);
        const response = this.toUploadResponse(upload);
        response.url = freshUrl;
        return response;
      })
    );

    return uploadsWithUrls;
  }

  /**
   * Link upload to entity
   */
  async linkUploadToEntity(
    uploadId: string,
    entityType: 'rfq' | 'bid' | 'contract' | 'dispute',
    entityId: string,
    requesterCompanyId?: string
  ): Promise<UploadFileResponse> {
    const upload = await this.repository.findById(uploadId);
    if (!upload) {
      throw new AppError('Upload not found', 404);
    }

    // Enforce company isolation (skip for platform-level uploads without companyId)
    if (requesterCompanyId && upload.companyId && upload.companyId.toString() !== requesterCompanyId) {
      throw new AppError('Access denied: Upload belongs to different company', 403);
    }

    // Update entity link
    upload.entityType = entityType;
    upload.entityId = new mongoose.Types.ObjectId(entityId);
    await upload.save();

    // Generate fresh presigned URL
    const freshUrl = await this.s3Service.getPresignedUrl(upload.s3Key, 3600);
    const response = this.toUploadResponse(upload);
    response.url = freshUrl;

    return response;
  }

  /**
   * Delete upload (soft delete + S3 deletion)
   */
  async deleteUpload(id: string, requesterCompanyId?: string): Promise<void> {
    const upload = await this.repository.findById(id);
    if (!upload) {
      throw new AppError('Upload not found', 404);
    }

    // Enforce company isolation (skip for platform-level uploads without companyId)
    if (requesterCompanyId && upload.companyId && upload.companyId.toString() !== requesterCompanyId) {
      throw new AppError('Access denied: Upload belongs to different company', 403);
    }

    // Delete from S3
    try {
      await this.s3Service.deleteFile(upload.s3Key);
    } catch (error) {
      logger.error(`Failed to delete file from S3: ${upload.s3Key}`, error);
      // Continue with database deletion even if S3 deletion fails
    }

    // Soft delete from database
    await this.repository.softDelete(id);
  }

  /**
   * Convert IUpload to UploadFileResponse
   */
  private toUploadResponse(upload: IUpload): UploadFileResponse {
    return {
      id: upload._id.toString(),
      fileName: upload.fileName,
      originalName: upload.originalName,
      mimeType: upload.mimeType,
      size: upload.size,
      url: upload.url,
      uploadedBy: upload.uploadedBy.toString(),
      companyId: upload.companyId?.toString() || '',
      category: upload.category,
      entityType: upload.entityType,
      entityId: upload.entityId?.toString(),
      description: upload.description,
      createdAt: upload.createdAt,
    };
  }
}
