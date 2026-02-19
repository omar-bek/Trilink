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
      credentials: config.aws?.accessKeyId
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
      throw new Error('S3 bucket not configured');
    }

    // Generate unique file key
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(8).toString('hex');
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `uploads/${category}/${companyId}/${timestamp}-${randomHash}-${sanitizedFileName}`;

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
        // Set ACL to private (files are not publicly accessible)
        ACL: 'private',
      });

      await this.s3Client.send(command);

      logger.info(`File uploaded to S3: ${key}`);

      return {
        key,
        bucket: this.bucketName,
      };
    } catch (error) {
      logger.error('S3 upload error:', error);
      throw new Error('Failed to upload file to S3');
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
