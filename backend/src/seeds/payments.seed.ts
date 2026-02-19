import mongoose from 'mongoose';
import { Payment, PaymentStatus } from '../modules/payments/schema';

export interface SeedPayment {
  contractId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  recipientCompanyId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  milestone: string;
  amount: number;
  currency: string;
  dueDate: Date;
  status: PaymentStatus;
}

export const seedPayments = async (
  contractIds: Record<string, mongoose.Types.ObjectId>,
  buyerCompanyId: mongoose.Types.ObjectId,
  buyerIds: Record<string, mongoose.Types.ObjectId>,
  companyIds: Record<string, mongoose.Types.ObjectId>,
  allBidPrices: Record<string, Record<string, number>>,
  contracts: Array<{
    title: string;
    paymentSchedule: Array<{
      milestone: string;
      amount: number;
      dueDate: Date;
      status: string;
    }>;
  }>
): Promise<void> => {
  console.log('💳 Seeding Payments...');

  let totalPaymentCount = 0;

  for (const contract of contracts) {
    const contractId = contractIds[contract.title];
    if (!contractId) continue;

    const bidPrices = allBidPrices[contract.title] || {};
    const buyerId = buyerIds[contract.title] || buyerIds['buyer1@trilink.ae'];

    // Create payments for each party based on payment schedule
    const parties = [
      { role: 'Supplier', companyId: companyIds['Supplier'], amount: bidPrices['Supplier'] || 0 },
      { role: 'Logistics', companyId: companyIds['Logistics'], amount: bidPrices['Logistics'] || 0 },
      { role: 'Clearance', companyId: companyIds['Clearance'], amount: bidPrices['Clearance'] || 0 },
      { role: 'Service Provider', companyId: companyIds['Service Provider'], amount: bidPrices['Service Provider'] || 0 },
    ];

    for (const party of parties) {
      if (party.amount === 0) continue; // Skip if no amount

      for (const milestone of contract.paymentSchedule) {
        // Calculate payment amount: milestone percentage * party's amount
        const totalScheduleAmount = contract.paymentSchedule.reduce((sum, m) => sum + m.amount, 0);
        const milestonePercentage = milestone.amount / totalScheduleAmount;
        const paymentAmount = party.amount * milestonePercentage;
        
        // Calculate VAT (UAE 5%)
        const vatRate = 0.05;
        const vatAmount = paymentAmount * vatRate;
        const totalAmount = paymentAmount + vatAmount;
        
        // Determine status based on milestone
        let status: PaymentStatus;
        if (milestone.milestone === 'Advance Payment') {
          status = PaymentStatus.COMPLETED; // First milestone completed
        } else if (milestone.milestone === 'Delivery Payment') {
          status = PaymentStatus.APPROVED; // Second milestone approved
        } else {
          status = PaymentStatus.PENDING_APPROVAL; // Final milestone pending
        }

        // Check if payment already exists
        const existingPayment = await Payment.findOne({
          contractId,
          recipientCompanyId: party.companyId,
          milestone: milestone.milestone,
        });

        if (!existingPayment) {
          await Payment.create({
            contractId,
            companyId: buyerCompanyId,
            recipientCompanyId: party.companyId,
            buyerId,
            milestone: milestone.milestone,
            amount: paymentAmount,
            vatAmount,
            vatRate,
            totalAmount,
            currency: 'AED',
            dueDate: milestone.dueDate,
            status,
            paidDate: status === PaymentStatus.COMPLETED ? new Date() : undefined,
            approvedAt: status === PaymentStatus.APPROVED || status === PaymentStatus.COMPLETED ? new Date() : undefined,
            approvedBy: status === PaymentStatus.APPROVED || status === PaymentStatus.COMPLETED ? buyerId : undefined,
          });
          totalPaymentCount++;
          console.log(`  ✓ Created ${milestone.milestone} payment for ${party.role} (${contract.title}): ${totalAmount.toFixed(2)} AED (${status})`);
        } else {
          // Calculate VAT and total for existing payment update
          const vatRate = 0.05;
          const vatAmount = paymentAmount * vatRate;
          const totalAmount = paymentAmount + vatAmount;
          
          // Update existing payment
          existingPayment.amount = paymentAmount;
          existingPayment.vatAmount = vatAmount;
          existingPayment.vatRate = vatRate;
          existingPayment.totalAmount = totalAmount;
          existingPayment.status = status;
          existingPayment.paidDate = status === PaymentStatus.COMPLETED ? new Date() : existingPayment.paidDate;
          existingPayment.approvedAt = status === PaymentStatus.APPROVED || status === PaymentStatus.COMPLETED ? new Date() : existingPayment.approvedAt;
          existingPayment.approvedBy = status === PaymentStatus.APPROVED || status === PaymentStatus.COMPLETED ? buyerId : existingPayment.approvedBy;
          await existingPayment.save();
          console.log(`  ✓ Updated ${milestone.milestone} payment for ${party.role} (${contract.title}): ${totalAmount.toFixed(2)} AED (${status})`);
        }
      }
    }
  }

  console.log(`✅ Seeded ${totalPaymentCount} payments\n`);
};
