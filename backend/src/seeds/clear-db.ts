import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../modules/users/schema';
import { Company } from '../modules/companies/schema';
import { PurchaseRequest } from '../modules/purchase-requests/schema';
import { RFQ } from '../modules/rfqs/schema';
import { Bid } from '../modules/bids/schema';
import { Contract } from '../modules/contracts/schema';
import { Shipment } from '../modules/shipments/schema';
import { Payment } from '../modules/payments/schema';
import { Dispute } from '../modules/disputes/schema';
import { AuditLog } from '../modules/audit/schema';
import { Upload } from '../modules/uploads/schema';
import { Notification } from '../modules/notifications/schema';
import { ContractAmendment } from '../modules/contracts/amendment.schema';
import { CompanyCategory } from '../modules/company-categories/schema';
import { Category } from '../modules/categories/schema';

/**
 * Clear all data from database
 * Safe to run multiple times (idempotent)
 * Clears all collections in proper order to avoid foreign key issues
 */
const clearDatabase = async (): Promise<void> => {
  try {
    console.log('🔌 Connecting to database...');
    await connectDatabase();

    console.log('\n🗑️  Clearing all collections...\n');

    // Clear in reverse dependency order to avoid foreign key issues
    // Start with dependent collections first
    
    await AuditLog.deleteMany({});
    console.log('  ✓ Cleared Audit Logs');

    await Notification.deleteMany({});
    console.log('  ✓ Cleared Notifications');

    await Upload.deleteMany({});
    console.log('  ✓ Cleared Uploads');

    await ContractAmendment.deleteMany({});
    console.log('  ✓ Cleared Contract Amendments');

    await Dispute.deleteMany({});
    console.log('  ✓ Cleared Disputes');

    await Payment.deleteMany({});
    console.log('  ✓ Cleared Payments');

    await Shipment.deleteMany({});
    console.log('  ✓ Cleared Shipments');

    await Contract.deleteMany({});
    console.log('  ✓ Cleared Contracts');

    await Bid.deleteMany({});
    console.log('  ✓ Cleared Bids');

    await RFQ.deleteMany({});
    console.log('  ✓ Cleared RFQs');

    await PurchaseRequest.deleteMany({});
    console.log('  ✓ Cleared Purchase Requests');

    await CompanyCategory.deleteMany({});
    console.log('  ✓ Cleared Company Categories');

    await User.deleteMany({});
    console.log('  ✓ Cleared Users');

    await Company.deleteMany({});
    console.log('  ✓ Cleared Companies');

    await Category.deleteMany({});
    console.log('  ✓ Cleared Categories');

    console.log('\n✅ All data cleared successfully!\n');
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error clearing database:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    await disconnectDatabase();
    process.exit(1);
  }
};

clearDatabase();
