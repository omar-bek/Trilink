/**
 * Database Security Configuration
 * Sets up database-level security indexes and constraints
 * Provides defense-in-depth for multi-tenant isolation
 */

import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/**
 * Configure database-level security indexes
 * Creates compound indexes for efficient company filtering
 */
export async function configureDatabaseSecurity(): Promise<void> {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    logger.info('Configuring database security indexes...');

    // Contracts collection
    await db.collection('contracts').createIndex(
      { buyerCompanyId: 1, _id: 1, deletedAt: 1 },
      { name: 'contracts_company_isolation_idx', background: true }
    );
    await db.collection('contracts').createIndex(
      { 'parties.companyId': 1, deletedAt: 1 },
      { name: 'contracts_parties_company_idx', background: true }
    );

    // Purchase Requests collection
    await db.collection('purchaserequests').createIndex(
      { companyId: 1, _id: 1, deletedAt: 1 },
      { name: 'purchaserequests_company_isolation_idx', background: true }
    );

    // Payments collection
    await db.collection('payments').createIndex(
      { companyId: 1, _id: 1, deletedAt: 1 },
      { name: 'payments_company_isolation_idx', background: true }
    );
    await db.collection('payments').createIndex(
      { recipientCompanyId: 1, _id: 1, deletedAt: 1 },
      { name: 'payments_recipient_company_idx', background: true }
    );

    // RFQs collection
    await db.collection('rfqs').createIndex(
      { companyId: 1, _id: 1, deletedAt: 1 },
      { name: 'rfqs_company_isolation_idx', background: true }
    );

    // Bids collection
    await db.collection('bids').createIndex(
      { companyId: 1, _id: 1, deletedAt: 1 },
      { name: 'bids_company_isolation_idx', background: true }
    );

    // Shipments collection
    await db.collection('shipments').createIndex(
      { companyId: 1, _id: 1, deletedAt: 1 },
      { name: 'shipments_company_isolation_idx', background: true }
    );

    // Disputes collection
    await db.collection('disputes').createIndex(
      { companyId: 1, _id: 1, deletedAt: 1 },
      { name: 'disputes_company_isolation_idx', background: true }
    );
    await db.collection('disputes').createIndex(
      { againstCompanyId: 1, _id: 1, deletedAt: 1 },
      { name: 'disputes_against_company_idx', background: true }
    );

    // Users collection
    await db.collection('users').createIndex(
      { companyId: 1, _id: 1, deletedAt: 1 },
      { name: 'users_company_isolation_idx', background: true }
    );

    logger.info('✅ Database security indexes created successfully');
  } catch (error) {
    logger.error('Failed to configure database security:', error);
    // Don't throw - allow server to start even if indexes fail
    // Indexes can be created manually later
  }
}

/**
 * MongoDB aggregation pipeline helper for company filtering
 * Ensures all aggregation queries respect company isolation
 */
export function addCompanyFilterPipeline(
  pipeline: any[],
  companyId: string,
  companyIdField: string = 'companyId'
): any[] {
  return [
    {
      $match: {
        [companyIdField]: new mongoose.Types.ObjectId(companyId),
        deletedAt: null,
      },
    },
    ...pipeline,
  ];
}

/**
 * Verify database security indexes exist
 */
export async function verifyDatabaseSecurity(): Promise<boolean> {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return false;
    }

    const requiredIndexes = [
      'contracts_company_isolation_idx',
      'purchaserequests_company_isolation_idx',
      'payments_company_isolation_idx',
      'rfqs_company_isolation_idx',
      'bids_company_isolation_idx',
      'shipments_company_isolation_idx',
      'disputes_company_isolation_idx',
    ];

    for (const indexName of requiredIndexes) {
      const collectionName = indexName.split('_')[0];
      const indexes = await db.collection(collectionName).indexes();
      const indexExists = indexes.some((idx: any) => idx.name === indexName);

      if (!indexExists) {
        logger.warn(`Security index ${indexName} not found`);
        return false;
      }
    }

    logger.info('✅ Database security indexes verified');
    return true;
  } catch (error) {
    logger.error('Failed to verify database security:', error);
    return false;
  }
}
