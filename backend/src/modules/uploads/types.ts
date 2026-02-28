export interface UploadFileResponse {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  companyId?: string; // Optional for platform-level uploads (e.g., logo)
  category: FileCategory;
  entityType?: 'rfq' | 'bid' | 'contract' | 'dispute';
  entityId?: string;
  description?: string;
  createdAt: Date;
}

export enum FileCategory {
  RFQ_ATTACHMENT = 'rfq_attachment',
  BID_ATTACHMENT = 'bid_attachment',
  DISPUTE_ATTACHMENT = 'dispute_attachment',
  COMPANY_DOCUMENT = 'company_document',
  CONTRACT_DOCUMENT = 'contract_document',
  CUSTOMS_DOCUMENT = 'customs_document',
  PROFILE_IMAGE = 'profile_image',
  PLATFORM_LOGO = 'platform_logo',
  OTHER = 'other',
}

export interface UploadFileDto {
  category: FileCategory;
  description?: string;
  entityType?: 'rfq' | 'bid' | 'contract' | 'dispute';
  entityId?: string;
}

export interface FileMetadata {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: FileCategory;
  uploadedBy: string;
  companyId: string;
  s3Key: string;
  s3Bucket: string;
}
