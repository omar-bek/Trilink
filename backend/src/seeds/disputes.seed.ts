import mongoose from 'mongoose';
import { Dispute, DisputeStatus } from '../modules/disputes/schema';

export interface SeedDispute {
  contractId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  raisedBy: mongoose.Types.ObjectId;
  againstCompanyId: mongoose.Types.ObjectId;
  type: string;
  description: string;
  attachments: Array<{
    type: string;
    url: string;
    uploadedAt: Date;
  }>;
}

export const seedDispute = async (
  contractIds: Record<string, mongoose.Types.ObjectId>,
  buyerCompanyId: mongoose.Types.ObjectId,
  buyerIds: Record<string, mongoose.Types.ObjectId>,
  supplierCompanyId: mongoose.Types.ObjectId,
  contracts: Array<{ title: string }>
): Promise<void> => {
  console.log('⚖️  Seeding Disputes...');

  const disputeTypes = ['Quality', 'Delivery', 'Payment', 'Specification'];
  const disputeDescriptions = [
    'Some items received do not meet the specified quality standards. Requesting replacement or refund for defective items.',
    'Delivery was delayed beyond the agreed timeframe. Requesting compensation for the delay.',
    'Payment terms were not followed as per contract agreement. Requesting clarification and resolution.',
    'Delivered items do not match the specifications outlined in the contract. Requesting correction or replacement.',
  ];

  let disputeCount = 0;

  // Create disputes for some contracts (not all)
  for (let i = 0; i < Math.min(contracts.length, 2); i++) {
    const contract = contracts[i];
    const contractId = contractIds[contract.title];
    if (!contractId) continue;

    const buyerId = buyerIds[contract.title] || buyerIds['buyer1@trilink.ae'];
    const disputeType = disputeTypes[i % disputeTypes.length];
    const description = disputeDescriptions[i % disputeDescriptions.length];

    const disputeData: SeedDispute = {
      contractId,
      companyId: buyerCompanyId,
      raisedBy: buyerId,
      againstCompanyId: supplierCompanyId,
      type: disputeType,
      description,
      attachments: [
        {
          type: 'image',
          url: `https://docs.trilink.ae/disputes/${contract.title.toLowerCase().replace(/\s+/g, '-')}-issue-1.jpg`,
          uploadedAt: new Date(),
        },
        {
          type: 'document',
          url: `https://docs.trilink.ae/disputes/${contract.title.toLowerCase().replace(/\s+/g, '-')}-report.pdf`,
          uploadedAt: new Date(),
        },
      ],
    };

    // Check if dispute already exists
    let dispute = await Dispute.findOne({
      contractId,
      companyId: buyerCompanyId,
      againstCompanyId: supplierCompanyId,
    });

    if (!dispute) {
      dispute = await Dispute.create({
        ...disputeData,
        status: DisputeStatus.UNDER_REVIEW,
        escalatedToGovernment: false,
      });
      disputeCount++;
      console.log(`  ✓ Created Dispute for ${contract.title}: ${disputeType} - ${description.substring(0, 50)}...`);
    } else {
      // Update existing dispute
      Object.assign(dispute, disputeData);
      dispute.status = DisputeStatus.UNDER_REVIEW;
      dispute.escalatedToGovernment = false;
      await dispute.save();
      console.log(`  ✓ Updated Dispute for ${contract.title}: ${disputeType}`);
    }
  }

  console.log(`✅ Seeded ${disputeCount} Disputes\n`);
};
