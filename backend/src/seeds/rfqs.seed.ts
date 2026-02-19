import mongoose from 'mongoose';
import { RFQ, RFQType, RFQStatus } from '../modules/rfqs/schema';
import { Role } from '../config/rbac';
import { CompanyType } from '../modules/companies/schema';

export interface SeedRFQ {
  purchaseRequestId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  type: RFQType;
  targetRole: Role;
  targetCompanyType: CompanyType;
  title: string;
  description: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    specifications: string;
  }>;
  budget: number;
  currency: string;
  deliveryLocation: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  requiredDeliveryDate: Date;
  deadline: Date;
  anonymousBuyer: boolean;
}

export const seedRFQs = async (
  buyerCompanyId: mongoose.Types.ObjectId,
  purchaseRequests: Array<{
    id: mongoose.Types.ObjectId;
    title: string;
    items: Array<{ name: string; quantity: number; unit: string; specifications: string }>;
    budget: number;
    currency: string;
    deliveryLocation: {
      address: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
      coordinates?: { lat: number; lng: number };
    };
    requiredDeliveryDate: Date;
    rfqGenerated: boolean;
  }>
): Promise<Record<string, Record<string, mongoose.Types.ObjectId>>> => {
  console.log('📨 Seeding RFQs...');

  const rfqConfigs = [
    {
      type: RFQType.SUPPLIER,
      targetRole: Role.SUPPLIER,
      targetCompanyType: CompanyType.SUPPLIER,
      titlePrefix: 'RFQ - Supply Services',
      descriptionPrefix: 'Request for quotation for supply services',
      budgetPercentage: 0.6, // 60% for supplier
    },
    {
      type: RFQType.LOGISTICS,
      targetRole: Role.LOGISTICS,
      targetCompanyType: CompanyType.LOGISTICS,
      titlePrefix: 'RFQ - Logistics Services',
      descriptionPrefix: 'Request for quotation for logistics and transportation services',
      budgetPercentage: 0.15, // 15% for logistics
    },
    {
      type: RFQType.CLEARANCE,
      targetRole: Role.CLEARANCE,
      targetCompanyType: CompanyType.CLEARANCE,
      titlePrefix: 'RFQ - Customs Clearance Services',
      descriptionPrefix: 'Request for quotation for customs clearance and documentation services',
      budgetPercentage: 0.1, // 10% for clearance
    },
    {
      type: RFQType.SERVICE_PROVIDER,
      targetRole: Role.SERVICE_PROVIDER,
      targetCompanyType: CompanyType.SERVICE_PROVIDER,
      titlePrefix: 'RFQ - Inspection & Quality Services',
      descriptionPrefix: 'Request for quotation for inspection, quality control, and certification services',
      budgetPercentage: 0.15, // 15% for service provider
    },
  ];

  const allRfqIds: Record<string, Record<string, mongoose.Types.ObjectId>> = {};
  const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  for (const pr of purchaseRequests) {
    if (!pr.rfqGenerated) continue; // Skip PRs that haven't generated RFQs yet

    const rfqIds: Record<string, mongoose.Types.ObjectId> = {};

    for (const config of rfqConfigs) {
      // Check if RFQ already exists
      let rfq = await RFQ.findOne({
        purchaseRequestId: pr.id,
        type: config.type,
      });

      if (!rfq) {
        rfq = await RFQ.create({
          purchaseRequestId: pr.id,
          companyId: buyerCompanyId,
          type: config.type,
          targetRole: config.targetRole,
          targetCompanyType: config.targetCompanyType,
          title: `${config.titlePrefix} - ${pr.title}`,
          description: `${config.descriptionPrefix} for ${pr.title}`,
          items: pr.items,
          budget: pr.budget * config.budgetPercentage,
          currency: pr.currency,
          deliveryLocation: pr.deliveryLocation,
          requiredDeliveryDate: pr.requiredDeliveryDate,
          deadline,
          status: RFQStatus.OPEN,
          anonymousBuyer: false,
        });
        console.log(`  ✓ Created ${config.type} RFQ for: ${pr.title}`);
      } else {
        // Update existing RFQ
        Object.assign(rfq, {
          title: `${config.titlePrefix} - ${pr.title}`,
          description: `${config.descriptionPrefix} for ${pr.title}`,
          items: pr.items,
          budget: pr.budget * config.budgetPercentage,
          deadline,
          status: RFQStatus.OPEN,
        });
        await rfq.save();
        console.log(`  ✓ Updated ${config.type} RFQ for: ${pr.title}`);
      }

      rfqIds[config.type] = rfq._id;
    }

    allRfqIds[pr.title] = rfqIds;
  }

  console.log(`✅ Seeded RFQs for ${Object.keys(allRfqIds).length} Purchase Requests\n`);
  return allRfqIds;
};
