import mongoose from 'mongoose';
import { Contract, ContractStatus } from '../modules/contracts/schema';
import { Role } from '../config/rbac';
import { RFQType } from '../modules/rfqs/schema';

export interface SeedContract {
    purchaseRequestId: mongoose.Types.ObjectId;
    buyerCompanyId: mongoose.Types.ObjectId;
    parties: Array<{
        companyId: mongoose.Types.ObjectId;
        userId: mongoose.Types.ObjectId;
        role: string;
        bidId: mongoose.Types.ObjectId;
    }>;
    amounts: {
        total: number;
        currency: string;
        breakdown: Array<{
            partyId: mongoose.Types.ObjectId;
            amount: number;
            description: string;
        }>;
    };
    paymentSchedule: Array<{
        milestone: string;
        amount: number;
        dueDate: Date;
        status: string;
    }>;
    terms: string;
    startDate: Date;
    endDate: Date;
}

export const seedContract = async (
    purchaseRequestIds: Record<string, mongoose.Types.ObjectId>,
    buyerCompanyId: mongoose.Types.ObjectId,
    userIds: Record<string, mongoose.Types.ObjectId>,
    companyIds: Record<string, mongoose.Types.ObjectId>,
    allBidIds: Record<string, Record<string, mongoose.Types.ObjectId>>,
    allBidPrices: Record<string, Record<string, number>>
): Promise<Record<string, mongoose.Types.ObjectId>> => {
    console.log('📄 Seeding Contracts...');

    const { Bid } = await import('../modules/bids/schema');
    const contractIds: Record<string, mongoose.Types.ObjectId> = {};

    for (const [prTitle, bidIds] of Object.entries(allBidIds)) {
        const purchaseRequestId = purchaseRequestIds[prTitle];
        if (!purchaseRequestId) continue;

        const bidPrices = allBidPrices[prTitle] || {};

        // Get bid details to build parties
        const parties = [];
        const roleBidMap = [
            { role: 'Supplier', rfqType: RFQType.SUPPLIER, companyKey: 'Supplier' },
            { role: 'Logistics', rfqType: RFQType.LOGISTICS, companyKey: 'Logistics' },
            { role: 'Clearance', rfqType: RFQType.CLEARANCE, companyKey: 'Clearance' },
            { role: 'Service Provider', rfqType: RFQType.SERVICE_PROVIDER, companyKey: 'Service Provider' },
        ];

        for (const roleMap of roleBidMap) {
            const bidId = bidIds[roleMap.rfqType];
            if (!bidId) continue;

            const bid = await Bid.findById(bidId);
            if (!bid) continue;

            const roleKey = roleMap.role === 'Supplier' ? Role.SUPPLIER :
                roleMap.role === 'Logistics' ? Role.LOGISTICS :
                    roleMap.role === 'Clearance' ? Role.CLEARANCE :
                        Role.SERVICE_PROVIDER;

            parties.push({
                companyId: companyIds[roleMap.companyKey],
                userId: userIds[roleKey],
                role: roleMap.role,
                bidId: bid._id,
            });
        }

        if (parties.length === 0) continue;

        // Calculate amounts breakdown
        const breakdown = parties.map((party) => {
            const price = bidPrices[party.role] || 0;
            return {
                partyId: party.companyId,
                amount: price,
                description: `${party.role} services`,
            };
        });

        const total = breakdown.reduce((sum, item) => sum + item.amount, 0);

        // Create payment schedule (3 milestones)
        const startDate = new Date();
        const endDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days from now

        const paymentSchedule = [
            {
                milestone: 'Advance Payment',
                amount: total * 0.3,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                status: 'pending',
            },
            {
                milestone: 'Delivery Payment',
                amount: total * 0.4,
                dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
                status: 'pending',
            },
            {
                milestone: 'Final Payment',
                amount: total * 0.3,
                dueDate: endDate,
                status: 'pending',
            },
        ];

        const contractData: SeedContract = {
            purchaseRequestId,
            buyerCompanyId,
            parties,
            amounts: {
                total,
                currency: 'AED',
                breakdown,
            },
            paymentSchedule,
            terms: 'This contract is subject to UAE procurement laws. All parties agree to deliver services as per specifications. Payment will be made according to the payment schedule upon completion of milestones.',
            startDate,
            endDate,
        };

        // Check if contract already exists
        let contract = await Contract.findOne({
            purchaseRequestId,
        });

        if (!contract) {
            contract = await Contract.create({
                ...contractData,
                status: ContractStatus.ACTIVE,
                signatures: parties.map((party) => ({
                    partyId: party.companyId,
                    userId: party.userId,
                    signedAt: new Date(),
                    signature: `sig_${party.companyId}_${Date.now()}`, // Mock signature hash
                    signatureHash: `hash_${party.companyId}_${Date.now()}`, // Mock signature hash
                    verified: true,
                    algorithm: 'RSA-SHA256',
                })),
            });
            console.log(`  ✓ Created Contract for ${prTitle}: Total ${total.toFixed(2)} AED`);
        } else {
            // Update existing contract
            Object.assign(contract, contractData);
            contract.status = ContractStatus.ACTIVE;
            // Ensure all signatures are present
            if (contract.signatures.length !== parties.length) {
                contract.signatures = parties.map((party) => ({
                    partyId: party.companyId,
                    userId: party.userId,
                    signedAt: new Date(),
                    signature: `sig_${party.companyId}_${Date.now()}`,
                    signatureHash: `hash_${party.companyId}_${Date.now()}`, // Mock signature hash
                    verified: true,
                    algorithm: 'RSA-SHA256',
                }));
            }
            await contract.save();
            console.log(`  ✓ Updated Contract for ${prTitle}: Total ${total.toFixed(2)} AED`);
        }

        contractIds[prTitle] = contract._id;
    }

    console.log(`✅ Seeded ${Object.keys(contractIds).length} Contracts\n`);
    return contractIds;
};
