import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';
import crypto from 'crypto';

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    this.bucketName = config.aws?.s3Bucket || process.env.AWS_S3_BUCKET || '';
    this.region = config.aws?.region || process.env.AWS_REGION || 'us-east-1';

    if (!this.bucketName) {
      logger.warn('AWS S3 bucket not configured. File uploads will fail.');
    }

    this.s3Client = new S3Client({
      region: this.region,
      credentials: config.aws?.accessKeyId && config.aws?.secretAccessKey
        ? {
            accessKeyId: config.aws.accessKeyId,
            secretAccessKey: config.aws.secretAccessKey,
          }
        : undefined,
    });
  }

  /**
   * Upload file to S3
   */
  async uploadFile(
    file: Express.Multer.File,
    category: string,
    companyId: string,
    userId: string
  ): Promise<{ key: string; bucket: string }> {
    if (!this.bucketName) {
      throw new Error('AWS S3 bucket not configured. Please set AWS_S3_BUCKET environment variable.');
    }
    
    if (!config.aws?.accessKeyId || !config.aws?.secretAccessKey) {
      throw new Error('AWS S3 credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
    }

    // Generate unique file key
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(8).toString('hex');
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    // For platform logo, use 'system' as companyId
    const companyFolder = companyId === 'system' ? 'system' : companyId;
    const key = `uploads/${category}/${companyFolder}/${timestamp}-${randomHash}-${sanitizedFileName}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          uploadedBy: userId,
          companyId: companyId,
          originalName: file.originalname,
        },
        // Note: ACL removed as it may not be supported in all S3 buckets
        // Files are private by default in S3
      });

      await this.s3Client.send(command);

      logger.info(`File uploaded to S3: ${key}`);

      return {
        key,
        bucket: this.bucketName,
      };
    } catch (error: any) {
      logger.error('S3 upload error:', error);
      const errorMessage = error.message || 'Unknown S3 error';
      
      // Provide more specific error messages
      if (errorMessage.includes('credentials') || errorMessage.includes('AccessDenied')) {
        throw new Error('AWS S3 credentials are invalid or missing. Please configure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
      } else if (errorMessage.includes('NoSuchBucket') || errorMessage.includes('bucket')) {
        throw new Error(`AWS S3 bucket "${this.bucketName}" does not exist. Please create the bucket or update AWS_S3_BUCKET environment variable`);
      } else if (errorMessage.includes('region')) {
        throw new Error(`AWS S3 region "${this.region}" is invalid. Please check AWS_REGION environment variable`);
      } else {
        throw new Error(`Failed to upload file to S3: ${errorMessage}`);
      }
    }
  }

  /**
   * Generate presigned URL for secure file access
   * URLs expire after specified time (default 1 hour)
   */
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.bucketName) {
      throw new Error('S3 bucket not configured');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      logger.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate file URL');
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    if (!this.bucketName) {
      throw new Error('S3 bucket not configured');
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      logger.info(`File deleted from S3: ${key}`);
    } catch (error) {
      logger.error('S3 delete error:', error);
      throw new Error('Failed to delete file from S3');
    }
  }

  /**
   * Check if S3 is configured
   */
  isConfigured(): boolean {
    return !!this.bucketName;
  }
}
