import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../config/database';
import { logger } from '../../utils/logger';

/**
 * Migration: Add indexes to frequently queried fields
 * This migration adds indexes to improve query performance on:
 * - companyId, status, createdAt (single and compound)
 * - userId fields (buyerId, providerId, raisedBy, etc.)
 * - email, purchaseRequestId, contractId, rfqId
 */
export async function addIndexesMigration(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }

  logger.info('Starting index migration...');

  try {
    // Companies collection
    logger.info('Adding indexes to companies collection...');
    const companiesCollection = db.collection('companies');
    await companiesCollection.createIndex({ email: 1 }, { background: true });
    await companiesCollection.createIndex({ status: 1, createdAt: -1 }, { background: true });
    await companiesCollection.createIndex({ createdAt: -1 }, { background: true });
    logger.info('✅ Companies indexes added');

    // Users collection
    logger.info('Adding indexes to users collection...');
    const usersCollection = db.collection('users');
    await usersCollection.createIndex({ companyId: 1, createdAt: -1 }, { background: true });
    await usersCollection.createIndex({ companyId: 1, status: 1, createdAt: -1 }, { background: true });
    await usersCollection.createIndex({ createdAt: -1 }, { background: true });
    logger.info('✅ Users indexes added');

    // Bids collection
    logger.info('Adding indexes to bids collection...');
    const bidsCollection = db.collection('bids');
    await bidsCollection.createIndex({ createdAt: -1 }, { background: true });
    await bidsCollection.createIndex({ companyId: 1, status: 1, createdAt: -1 }, { background: true });
    await bidsCollection.createIndex({ rfqId: 1, createdAt: -1 }, { background: true });
    await bidsCollection.createIndex({ providerId: 1, status: 1, createdAt: -1 }, { background: true });
    logger.info('✅ Bids indexes added');

    // Contracts collection
    logger.info('Adding indexes to contracts collection...');
    const contractsCollection = db.collection('contracts');
    await contractsCollection.createIndex({ buyerCompanyId: 1, status: 1, createdAt: -1 }, { background: true });
    await contractsCollection.createIndex({ purchaseRequestId: 1, status: 1 }, { background: true });
    logger.info('✅ Contracts indexes added');

    // Payments collection
    logger.info('Adding indexes to payments collection...');
    const paymentsCollection = db.collection('payments');
    await paymentsCollection.createIndex({ createdAt: -1 }, { background: true });
    await paymentsCollection.createIndex({ companyId: 1, status: 1, createdAt: -1 }, { background: true });
    await paymentsCollection.createIndex({ contractId: 1, status: 1 }, { background: true });
    await paymentsCollection.createIndex({ buyerId: 1, status: 1 }, { background: true });
    await paymentsCollection.createIndex({ recipientCompanyId: 1, status: 1, createdAt: -1 }, { background: true });
    logger.info('✅ Payments indexes added');

    // Disputes collection
    logger.info('Adding indexes to disputes collection...');
    const disputesCollection = db.collection('disputes');
    await disputesCollection.createIndex({ createdAt: -1 }, { background: true });
    await disputesCollection.createIndex({ companyId: 1, status: 1, createdAt: -1 }, { background: true });
    await disputesCollection.createIndex({ contractId: 1, status: 1 }, { background: true });
    await disputesCollection.createIndex({ raisedBy: 1, status: 1, createdAt: -1 }, { background: true });
    logger.info('✅ Disputes indexes added');

    // Shipments collection
    logger.info('Adding indexes to shipments collection...');
    const shipmentsCollection = db.collection('shipments');
    await shipmentsCollection.createIndex({ createdAt: -1 }, { background: true });
    await shipmentsCollection.createIndex({ companyId: 1, status: 1, createdAt: -1 }, { background: true });
    await shipmentsCollection.createIndex({ contractId: 1, status: 1 }, { background: true });
    await shipmentsCollection.createIndex({ logisticsCompanyId: 1, status: 1, createdAt: -1 }, { background: true });
    logger.info('✅ Shipments indexes added');

    // Purchase Requests collection
    logger.info('Adding indexes to purchaserequests collection...');
    const purchaseRequestsCollection = db.collection('purchaserequests');
    await purchaseRequestsCollection.createIndex({ companyId: 1, status: 1, createdAt: -1 }, { background: true });
    await purchaseRequestsCollection.createIndex({ buyerId: 1, status: 1, createdAt: -1 }, { background: true });
    await purchaseRequestsCollection.createIndex({ approverId: 1, status: 1 }, { background: true });
    logger.info('✅ Purchase Requests indexes added');

    // RFQs collection
    logger.info('Adding indexes to rfqs collection...');
    const rfqsCollection = db.collection('rfqs');
    await rfqsCollection.createIndex({ createdAt: -1 }, { background: true });
    await rfqsCollection.createIndex({ companyId: 1, status: 1, createdAt: -1 }, { background: true });
    await rfqsCollection.createIndex({ purchaseRequestId: 1, status: 1 }, { background: true });
    await rfqsCollection.createIndex({ targetRole: 1, status: 1, createdAt: -1 }, { background: true });
    logger.info('✅ RFQs indexes added');

    logger.info('✅ All indexes migration completed successfully');
  } catch (error) {
    logger.error('❌ Error during index migration:', error);
    throw error;
  }
}

/**
 * Run the migration
 */
async function runMigration() {
  try {
    await connectDatabase();
    await addIndexesMigration();
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    await disconnectDatabase();
    process.exit(1);
  }
}

// Run migration if executed directly
if (require.main === module) {
  runMigration();
}
