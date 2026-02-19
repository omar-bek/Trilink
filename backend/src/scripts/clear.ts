import { connectDatabase } from '../config/database';
import { User } from '../modules/users/schema';
import { Company } from '../modules/companies/schema';
import { PurchaseRequest } from '../modules/purchase-requests/schema';
import { RFQ } from '../modules/rfqs/schema';
import { Bid } from '../modules/bids/schema';
import { Contract } from '../modules/contracts/schema';
import { Shipment } from '../modules/shipments/schema';
import { Payment } from '../modules/payments/schema';
import { Dispute } from '../modules/disputes/schema';
import { logger } from '../utils/logger';

/**
 * Clear all data from database
 */
const clear = async (): Promise<void> => {
  try {
    await connectDatabase();

    logger.info('Clearing all data...');

    await User.deleteMany({});
    await Company.deleteMany({});
    await PurchaseRequest.deleteMany({});
    await RFQ.deleteMany({});
    await Bid.deleteMany({});
    await Contract.deleteMany({});
    await Shipment.deleteMany({});
    await Payment.deleteMany({});
    await Dispute.deleteMany({});

    logger.info('✅ All data cleared successfully!');

    process.exit(0);
  } catch (error) {
    logger.error('Clear error:', error);
    process.exit(1);
  }
};

clear();
