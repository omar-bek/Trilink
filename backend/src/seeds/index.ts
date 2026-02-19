import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { seedCompanies } from './companies.seed';
import { seedUsers } from './users.seed';
import { seedPurchaseRequests } from './purchase-requests.seed';
import { seedRFQs } from './rfqs.seed';
import { seedBids } from './bids.seed';
import { seedContract } from './contracts.seed';
import { seedShipment } from './shipments.seed';
import { seedPayments } from './payments.seed';
import { seedDispute } from './disputes.seed';
import { seedUploads } from './uploads.seed';
import { seedCategories } from './categories.seed';
import { seedCompanyCategories } from './company-categories.seed';
import { PurchaseRequest } from '../modules/purchase-requests/schema';
import { BidStatus } from '../modules/bids/schema';
import { RFQType } from '../modules/rfqs/schema';
import { Role } from '../config/rbac';

/**
 * Main seed function
 * Seeds database with complete workflow data for multiple purchase requests
 */
const seed = async (): Promise<void> => {
  try {
    console.log('🌱 Starting database seeding...\n');
    console.log('🔌 Connecting to database...');
    await connectDatabase();

    // Step 1: Seed Categories (must be first for company assignments)
    const categoryIds = await seedCategories();

    // Step 2: Seed Companies
    const companyIds = await seedCompanies();

    // Step 3: Seed Company-Category Relationships
    await seedCompanyCategories(companyIds, categoryIds);

    // Step 4: Seed Users
    const userIds = await seedUsers(companyIds);

    // Step 5: Seed Multiple Purchase Requests (with categories)
    const purchaseRequestIds = await seedPurchaseRequests(userIds, companyIds['Buyer'], categoryIds);

    // Get all purchase requests data for RFQ generation
    const purchaseRequests = await PurchaseRequest.find({
      _id: { $in: Object.values(purchaseRequestIds) },
    });

    // Filter only submitted PRs for RFQ generation
    const submittedPRs = purchaseRequests
      .filter(pr => pr.rfqGenerated)
      .map(pr => ({
        id: pr._id,
        title: pr.title,
        items: pr.items,
        budget: pr.budget,
        currency: pr.currency,
        deliveryLocation: pr.deliveryLocation,
        requiredDeliveryDate: pr.requiredDeliveryDate,
        rfqGenerated: pr.rfqGenerated,
      }));

    // Step 4: Seed RFQs (auto-generated from Purchase Requests)
    const allRfqIds = await seedRFQs(companyIds['Buyer'], submittedPRs);

    // Step 5: Seed Bids (multiple per RFQ)
    const allBidIds = await seedBids(allRfqIds, userIds, companyIds);

    // Accept bids and collect prices
    const { Bid } = await import('../modules/bids/schema');
    const allBidPrices: Record<string, Record<string, number>> = {};

    for (const [prTitle, bidIds] of Object.entries(allBidIds)) {
      const bidPrices: Record<string, number> = {};
      const rfqTypeKeys = [RFQType.SUPPLIER, RFQType.LOGISTICS, RFQType.CLEARANCE, RFQType.SERVICE_PROVIDER];

      for (const rfqType of rfqTypeKeys) {
        const bidId = bidIds[rfqType];
        if (bidId) {
          const bid = await Bid.findById(bidId);
          if (bid) {
            bid.status = BidStatus.ACCEPTED;
            await bid.save();
            bidPrices[rfqType] = bid.price;

            // Map to role name for contract
            const roleName = rfqType === RFQType.SUPPLIER ? 'Supplier' :
              rfqType === RFQType.LOGISTICS ? 'Logistics' :
                rfqType === RFQType.CLEARANCE ? 'Clearance' :
                  'Service Provider';
            bidPrices[roleName] = bid.price;

            console.log(`  ✓ Accepted ${rfqType} bid for ${prTitle}: ${bid.price} AED`);
          }
        }
      }
      allBidPrices[prTitle] = bidPrices;
    }

    // Step 6: Seed Contracts (for each purchase request with accepted bids)
    const contractIds = await seedContract(
      purchaseRequestIds,
      companyIds['Buyer'],
      userIds,
      companyIds,
      allBidIds,
      allBidPrices
    );

    // Get contract data for payments and shipments
    const { Contract } = await import('../modules/contracts/schema');
    const contracts = await Contract.find({
      _id: { $in: Object.values(contractIds) },
    });

    const contractData = contracts.map(contract => {
      const prTitle = Object.keys(contractIds).find(key => contractIds[key].toString() === contract._id.toString()) || '';
      return {
        title: prTitle,
        paymentSchedule: contract.paymentSchedule,
      };
    });

    const prDataForShipments = purchaseRequests
      .filter(pr => contractIds[pr.title])
      .map(pr => ({
        title: pr.title,
        deliveryLocation: pr.deliveryLocation,
      }));

    // Step 7: Seed Shipments
    const shipmentIds = await seedShipment(
      contractIds,
      companyIds['Buyer'],
      companyIds['Logistics'],
      userIds[Role.LOGISTICS],
      prDataForShipments
    );

    // Step 8: Seed Payments (milestone-based)
    const buyerIdsMap: Record<string, mongoose.Types.ObjectId> = {};
    for (const pr of purchaseRequests) {
      buyerIdsMap[pr.title] = pr.buyerId;
    }

    await seedPayments(
      contractIds,
      companyIds['Buyer'],
      buyerIdsMap,
      companyIds,
      allBidPrices,
      contractData
    );

    // Step 9: Seed Disputes (for some contracts)
    const disputeContracts = contractData.slice(0, 2); // Create disputes for first 2 contracts
    await seedDispute(
      contractIds,
      companyIds['Buyer'],
      buyerIdsMap,
      companyIds['Supplier'],
      disputeContracts
    );

    // Get dispute IDs for uploads
    const { Dispute } = await import('../modules/disputes/schema');
    const disputes = await Dispute.find({
      contractId: { $in: Object.values(contractIds) },
    });
    const disputeIds = disputes.map(d => d._id);

    // Step 10: Seed Uploads
    await seedUploads(
      userIds,
      companyIds,
      allRfqIds,
      allBidIds,
      contractIds,
      disputeIds
    );

    console.log('\n✅ Database seeding completed successfully!\n');
    console.log('📋 Seeded Accounts (Password: Password123!):');
    console.log('  👤 Admin: admin@trilink.ae');
    console.log('  🏛️  Government: gov@trilink.ae');
    console.log('  👔 Company Managers:');
    console.log('    - Buyer Manager: manager@buyer.trilink.ae');
    console.log('    - Supplier Manager: manager@supplier.trilink.ae');
    console.log('    - Supplier 2 Manager: manager@supplier2.trilink.ae');
    console.log('    - Logistics Manager: manager@logistics.trilink.ae');
    console.log('    - Clearance Manager: manager@clearance.trilink.ae');
    console.log('    - Service Provider Manager: manager@serviceprovider.trilink.ae');
    console.log('  🛒 Buyer 1: buyer1@trilink.ae');
    console.log('  🛒 Buyer 2: buyer2@trilink.ae');
    console.log('  🛒 Buyer 3: buyer3@trilink.ae');
    console.log('  🛒 Buyer 4: buyer4@trilink.ae');
    console.log('  📦 Supplier 1: supplier1@trilink.ae');
    console.log('  📦 Supplier 2: supplier2@trilink.ae');
    console.log('  📦 Supplier 3: supplier3@trilink.ae');
    console.log('  📦 Supplier 4: supplier4@trilink.ae');
    console.log('  📦 Supplier 5 (MEPS): supplier5@trilink.ae');
    console.log('  📦 Supplier 6 (MEPS): supplier6@trilink.ae');
    console.log('  🚚 Logistics 1: logistics1@trilink.ae');
    console.log('  🚚 Logistics 2: logistics2@trilink.ae');
    console.log('  🚚 Logistics 3: logistics3@trilink.ae');
    console.log('  🚚 Logistics 4: logistics4@trilink.ae');
    console.log('  📋 Clearance: clearance@trilink.ae');
    console.log('  📋 Clearance 2: clearance2@trilink.ae');
    console.log('  📋 Clearance 3: clearance3@trilink.ae');
    console.log('  🔍 Service Provider: service@trilink.ae');
    console.log('  🔍 Service Provider 2: service2@trilink.ae');
    console.log('  🔍 Service Provider 3: service3@trilink.ae');
    console.log('\n📊 Seeded Data:');
    console.log(`  ✓ Companies (${Object.keys(companyIds).length} companies across all types)`);
    console.log(`  ✓ Users (20 users across all roles)`);
    console.log(`  ✓ Purchase Requests (${Object.keys(purchaseRequestIds).length} requests)`);
    console.log(`  ✓ RFQs (${Object.values(allRfqIds).reduce((sum, rfqs) => sum + Object.keys(rfqs).length, 0)} RFQs across all types)`);
    console.log(`  ✓ Bids (${Object.values(allBidIds).reduce((sum, bids) => sum + Object.keys(bids).length, 0)} bids)`);
    console.log(`  ✓ Contracts (${Object.keys(contractIds).length} contracts)`);
    console.log(`  ✓ Shipments (${Object.keys(shipmentIds).length} shipments)`);
    console.log(`  ✓ Payments (milestone-based across all contracts)`);
    console.log(`  ✓ Disputes (${disputes.length} disputes)`);
    console.log(`  ✓ Uploads (documents and attachments)`);
    console.log('\n🎉 System is ready for demo and testing!\n');

    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
    await disconnectDatabase();
    process.exit(1);
  }
};

seed();
