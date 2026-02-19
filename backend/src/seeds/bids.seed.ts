import mongoose from 'mongoose';
import { Bid, BidStatus } from '../modules/bids/schema';
import { RFQType } from '../modules/rfqs/schema';
import { Role } from '../config/rbac';

export interface PaymentScheduleItem {
  milestone: string;
  amount?: number;
  percentage?: number;
  dueDate?: Date;
  description?: string;
}

export interface SeedBid {
  rfqId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  price: number;
  currency: string;
  paymentTerms: string;
  paymentSchedule?: PaymentScheduleItem[];
  deliveryTime: number; // days
  deliveryDate: Date;
  validity: Date;
  aiScore: number;
  anonymousBidder: boolean;
}

export const seedBids = async (
  allRfqIds: Record<string, Record<string, mongoose.Types.ObjectId>>,
  userIds: Record<string, mongoose.Types.ObjectId>,
  companyIds: Record<string, mongoose.Types.ObjectId>
): Promise<Record<string, Record<string, mongoose.Types.ObjectId>>> => {
  console.log('💰 Seeding Bids...');

  const allBidIds: Record<string, Record<string, mongoose.Types.ObjectId>> = {};

  // Price multipliers for different RFQ types
  const priceMultipliers: Record<RFQType, number> = {
    [RFQType.SUPPLIER]: 0.17, // 17% of budget
    [RFQType.LOGISTICS]: 0.05, // 5% of budget
    [RFQType.CLEARANCE]: 0.04, // 4% of budget
    [RFQType.SERVICE_PROVIDER]: 0.05, // 5% of budget
  };

  const deliveryTimeMap: Record<RFQType, number> = {
    [RFQType.SUPPLIER]: 45,
    [RFQType.LOGISTICS]: 5,
    [RFQType.CLEARANCE]: 3,
    [RFQType.SERVICE_PROVIDER]: 7,
  };

  const paymentTermsMap: Record<RFQType, string> = {
    [RFQType.SUPPLIER]: '30% advance, 40% on delivery, 30% after inspection',
    [RFQType.LOGISTICS]: '50% advance, 50% on delivery',
    [RFQType.CLEARANCE]: '100% on completion',
    [RFQType.SERVICE_PROVIDER]: '40% advance, 60% on completion',
  };

  // Payment schedule configurations for each RFQ type
  const createPaymentSchedule = (
    rfqType: RFQType,
    price: number,
    deliveryDate: Date
  ): PaymentScheduleItem[] => {
    const now = new Date();
    const schedules: Record<RFQType, PaymentScheduleItem[]> = {
      [RFQType.SUPPLIER]: [
        {
          milestone: 'Advance Payment',
          percentage: 30,
          amount: Math.round(price * 0.30),
          dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          description: 'Payment upon contract signing',
        },
        {
          milestone: 'Delivery Payment',
          percentage: 40,
          amount: Math.round(price * 0.40),
          dueDate: new Date(deliveryDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before delivery
          description: 'Payment upon delivery confirmation',
        },
        {
          milestone: 'Final Payment',
          percentage: 30,
          amount: Math.round(price * 0.30),
          dueDate: new Date(deliveryDate.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days after delivery
          description: 'Payment after inspection and acceptance',
        },
      ],
      [RFQType.LOGISTICS]: [
        {
          milestone: 'Advance Payment',
          percentage: 50,
          amount: Math.round(price * 0.50),
          dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          description: 'Payment upon contract signing',
        },
        {
          milestone: 'Delivery Payment',
          percentage: 50,
          amount: Math.round(price * 0.50),
          dueDate: new Date(deliveryDate.getTime()), // On delivery date
          description: 'Payment upon successful delivery',
        },
      ],
      [RFQType.CLEARANCE]: [
        {
          milestone: 'Completion Payment',
          percentage: 100,
          amount: price,
          dueDate: new Date(deliveryDate.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days after completion
          description: 'Full payment upon clearance completion',
        },
      ],
      [RFQType.SERVICE_PROVIDER]: [
        {
          milestone: 'Advance Payment',
          percentage: 40,
          amount: Math.round(price * 0.40),
          dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          description: 'Payment upon contract signing',
        },
        {
          milestone: 'Completion Payment',
          percentage: 60,
          amount: Math.round(price * 0.60),
          dueDate: new Date(deliveryDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days after completion
          description: 'Payment upon service completion and acceptance',
        },
      ],
    };

    return schedules[rfqType] || [];
  };

  // Get RFQ details to calculate bid prices
  const { RFQ } = await import('../modules/rfqs/schema');

  for (const [prTitle, rfqIds] of Object.entries(allRfqIds)) {
    const bidIds: Record<string, mongoose.Types.ObjectId> = {};

    for (const [rfqType, rfqId] of Object.entries(rfqIds)) {
      const rfq = await RFQ.findById(rfqId);
      if (!rfq) continue;

      const basePrice = rfq.budget * priceMultipliers[rfqType as RFQType];
      const deliveryTime = deliveryTimeMap[rfqType as RFQType];

      const providerRole = rfqType === RFQType.SUPPLIER ? Role.SUPPLIER :
        rfqType === RFQType.LOGISTICS ? Role.LOGISTICS :
          rfqType === RFQType.CLEARANCE ? Role.CLEARANCE :
            Role.SERVICE_PROVIDER;

      // Map RFQType to CompanyType string for companyIds lookup
      const companyTypeKey = rfqType === RFQType.SUPPLIER ? 'Supplier' :
        rfqType === RFQType.LOGISTICS ? 'Logistics' :
          rfqType === RFQType.CLEARANCE ? 'Clearance' :
            'Service Provider';

      // Use the first user of each role (stored by role key in userIds)
      const providerId = userIds[providerRole];
      const companyId = companyIds[companyTypeKey];

      if (!providerId || !companyId) continue;

      const price = Math.round(basePrice);
      const deliveryDate = new Date(Date.now() + deliveryTime * 24 * 60 * 60 * 1000);

      // Create payment schedule based on RFQ type
      const paymentSchedule = createPaymentSchedule(
        rfqType as RFQType,
        price,
        deliveryDate
      );

      // Verify payment schedule totals 100%
      const totalPercentage = paymentSchedule.reduce((sum, item) => sum + (item.percentage || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        console.warn(`  ⚠️  Payment schedule for ${rfqType} bid totals ${totalPercentage}% instead of 100%`);
      }

      // Check if bid already exists
      let bid = await Bid.findOne({
        rfqId,
        companyId,
      });

      if (!bid) {
        bid = await Bid.create({
          rfqId,
          companyId,
          providerId,
          price,
          currency: rfq.currency,
          paymentTerms: paymentTermsMap[rfqType as RFQType],
          paymentSchedule,
          deliveryTime,
          deliveryDate,
          validity: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          aiScore: 8.5,
          anonymousBidder: false,
          status: BidStatus.SUBMITTED,
        });
        const scheduleInfo = paymentSchedule.length > 0
          ? ` (${paymentSchedule.length} payment milestones)`
          : '';
        console.log(`  ✓ Created ${rfqType} Bid for ${prTitle}: ${price} ${rfq.currency}${scheduleInfo}`);
      } else {
        Object.assign(bid, {
          price,
          currency: rfq.currency,
          paymentTerms: paymentTermsMap[rfqType as RFQType],
          paymentSchedule,
          deliveryTime,
          deliveryDate,
          aiScore: 8.5,
          status: BidStatus.SUBMITTED,
        });
        await bid.save();
        const scheduleInfo = paymentSchedule.length > 0
          ? ` (${paymentSchedule.length} payment milestones)`
          : '';
        console.log(`  ✓ Updated ${rfqType} Bid for ${prTitle}: ${price} ${rfq.currency}${scheduleInfo}`);
      }

      bidIds[rfqType] = bid._id;
    }

    allBidIds[prTitle] = bidIds;
  }

  const totalBids = Object.values(allBidIds).reduce((sum, bids) => sum + Object.keys(bids).length, 0);
  console.log(`✅ Seeded ${totalBids} bids across ${Object.keys(allBidIds).length} Purchase Requests\n`);
  return allBidIds;
};
