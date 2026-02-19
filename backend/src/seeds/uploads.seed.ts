import mongoose from 'mongoose';
import { Upload } from '../modules/uploads/schema';
import { FileCategory } from '../modules/uploads/types';
import { Role } from '../config/rbac';

export interface SeedUpload {
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
  companyId: mongoose.Types.ObjectId;
}

export const seedUploads = async (
  userIds: Record<string, mongoose.Types.ObjectId>,
  companyIds: Record<string, mongoose.Types.ObjectId>,
  rfqIds?: Record<string, Record<string, mongoose.Types.ObjectId>>,
  bidIds?: Record<string, Record<string, mongoose.Types.ObjectId>>,
  contractIds?: Record<string, mongoose.Types.ObjectId>,
  disputeIds?: mongoose.Types.ObjectId[]
): Promise<void> => {
  console.log('📎 Seeding Uploads...');

  const uploadsData: SeedUpload[] = [];

  // Company documents
  for (const [companyType, companyId] of Object.entries(companyIds)) {
    if (companyType === 'Buyer' || companyType === 'Supplier' || companyType === 'Logistics') {
      // Map company type to role for userId lookup
      const roleKey = companyType === 'Buyer' ? Role.BUYER :
                     companyType === 'Supplier' ? Role.SUPPLIER :
                     Role.LOGISTICS;
      const userId = userIds[roleKey] || userIds['buyer1@trilink.ae'];
      uploadsData.push({
        fileName: `company-${companyType.toLowerCase()}-license.pdf`,
        originalName: `Trade License - ${companyType}.pdf`,
        mimeType: 'application/pdf',
        size: 245760,
        url: `https://docs.trilink.ae/companies/${companyId}/license.pdf`,
        s3Key: `companies/${companyId}/license.pdf`,
        s3Bucket: 'trilink-documents',
        category: FileCategory.COMPANY_DOCUMENT,
        description: `Trade license document for ${companyType}`,
        uploadedBy: userId,
        companyId,
      });
    }
  }

  // RFQ attachments
  if (rfqIds) {
    for (const [prTitle, rfqs] of Object.entries(rfqIds)) {
      for (const [rfqType, rfqId] of Object.entries(rfqs)) {
        const userId = userIds['buyer1@trilink.ae'];
        const companyId = companyIds['Buyer'];
        uploadsData.push({
          fileName: `rfq-${prTitle.toLowerCase().replace(/\s+/g, '-')}-${rfqType}.pdf`,
          originalName: `RFQ Document - ${prTitle} - ${rfqType}.pdf`,
          mimeType: 'application/pdf',
          size: 512000,
          url: `https://docs.trilink.ae/rfqs/${rfqId}/document.pdf`,
          s3Key: `rfqs/${rfqId}/document.pdf`,
          s3Bucket: 'trilink-documents',
          category: FileCategory.RFQ_ATTACHMENT,
          description: `RFQ document for ${rfqType}`,
          entityType: 'rfq',
          entityId: rfqId,
          uploadedBy: userId,
          companyId,
        });
      }
    }
  }

  // Bid attachments
  if (bidIds) {
    for (const [prTitle, bids] of Object.entries(bidIds)) {
      for (const [bidType, bidId] of Object.entries(bids)) {
        const roleKey = bidType === 'Supplier' ? 'Supplier' :
                        bidType === 'Logistics' ? 'Logistics' :
                        bidType === 'Clearance' ? 'Clearance' :
                        'Service Provider';
        const userId = userIds[roleKey] || userIds['supplier1@trilink.ae'];
        const companyId = companyIds[roleKey] || companyIds['Supplier'];
        uploadsData.push({
          fileName: `bid-${prTitle.toLowerCase().replace(/\s+/g, '-')}-${bidType}.pdf`,
          originalName: `Bid Proposal - ${prTitle} - ${bidType}.pdf`,
          mimeType: 'application/pdf',
          size: 768000,
          url: `https://docs.trilink.ae/bids/${bidId}/proposal.pdf`,
          s3Key: `bids/${bidId}/proposal.pdf`,
          s3Bucket: 'trilink-documents',
          category: FileCategory.BID_ATTACHMENT,
          description: `Bid proposal document for ${bidType}`,
          entityType: 'bid',
          entityId: bidId,
          uploadedBy: userId,
          companyId,
        });
      }
    }
  }

  // Contract documents
  if (contractIds) {
    for (const [prTitle, contractId] of Object.entries(contractIds)) {
      const userId = userIds['buyer1@trilink.ae'];
      const companyId = companyIds['Buyer'];
      uploadsData.push({
        fileName: `contract-${prTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        originalName: `Contract Document - ${prTitle}.pdf`,
        mimeType: 'application/pdf',
        size: 1024000,
        url: `https://docs.trilink.ae/contracts/${contractId}/document.pdf`,
        s3Key: `contracts/${contractId}/document.pdf`,
        s3Bucket: 'trilink-documents',
        category: FileCategory.CONTRACT_DOCUMENT,
        description: `Contract document for ${prTitle}`,
        entityType: 'contract',
        entityId: contractId,
        uploadedBy: userId,
        companyId,
      });
    }
  }

  // Dispute attachments (if disputes exist)
  if (disputeIds && disputeIds.length > 0) {
    for (const disputeId of disputeIds) {
      const userId = userIds['buyer1@trilink.ae'];
      const companyId = companyIds['Buyer'];
      uploadsData.push({
        fileName: `dispute-${disputeId}-evidence.jpg`,
        originalName: 'Dispute Evidence Photo.jpg',
        mimeType: 'image/jpeg',
        size: 1536000,
        url: `https://docs.trilink.ae/disputes/${disputeId}/evidence.jpg`,
        s3Key: `disputes/${disputeId}/evidence.jpg`,
        s3Bucket: 'trilink-documents',
        category: FileCategory.DISPUTE_ATTACHMENT,
        description: 'Evidence photo for dispute',
        entityType: 'dispute',
        entityId: disputeId,
        uploadedBy: userId,
        companyId,
      });
    }
  }

  let uploadCount = 0;

  for (const uploadData of uploadsData) {
    // Check if upload already exists
    const existingUpload = await Upload.findOne({
      s3Key: uploadData.s3Key,
    });

    if (!existingUpload) {
      await Upload.create(uploadData);
      uploadCount++;
      console.log(`  ✓ Created Upload: ${uploadData.originalName}`);
    } else {
      // Update existing upload
      Object.assign(existingUpload, uploadData);
      await existingUpload.save();
      console.log(`  ✓ Updated Upload: ${uploadData.originalName}`);
    }
  }

  console.log(`✅ Seeded ${uploadCount} Uploads\n`);
};
