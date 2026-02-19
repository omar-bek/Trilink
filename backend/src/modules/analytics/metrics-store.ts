import mongoose from 'mongoose';
import { CacheService } from '../../utils/cache';
import { logger } from '../../utils/logger';
import { PurchaseRequest } from '../purchase-requests/schema';
import { Contract } from '../contracts/schema';
import { Bid } from '../bids/schema';
import { Payment } from '../payments/schema';
import { Dispute } from '../disputes/schema';
import { Company } from '../companies/schema';
import { RFQ } from '../rfqs/schema';

export interface PrecomputedMetrics {
  timestamp: Date;
  kpis: {
    totalPurchaseRequests: number;
    totalContracts: number;
    totalBids: number;
    totalPayments: number;
    totalDisputes: number;
    activeCompanies: number;
    totalRFQs: number;
    totalContractValue: number;
    totalPaymentVolume: number;
  };
  lastProcessedId?: string;
}

/**
 * Service for precomputing and storing metrics incrementally
 */
export class MetricsStore {
  private cache: CacheService;
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly METRICS_KEY_PREFIX = 'metrics';

  constructor() {
    this.cache = new CacheService('analytics');
  }

  /**
   * Get cache key for metrics
   */
  private getMetricsKey(scope: string, dateRange?: { startDate?: Date; endDate?: Date }): string {
    if (dateRange?.startDate || dateRange?.endDate) {
      const start = dateRange.startDate?.toISOString().split('T')[0] || 'all';
      const end = dateRange.endDate?.toISOString().split('T')[0] || 'all';
      return `${this.METRICS_KEY_PREFIX}:${scope}:${start}:${end}`;
    }
    return `${this.METRICS_KEY_PREFIX}:${scope}:all`;
  }

  /**
   * Get precomputed metrics from cache
   */
  async getMetrics(
    scope: string,
    dateRange?: { startDate?: Date; endDate?: Date }
  ): Promise<PrecomputedMetrics | null> {
    const key = this.getMetricsKey(scope, dateRange);
    return await this.cache.get<PrecomputedMetrics>(key);
  }

  /**
   * Store precomputed metrics in cache
   */
  async setMetrics(
    scope: string,
    metrics: PrecomputedMetrics,
    dateRange?: { startDate?: Date; endDate?: Date }
  ): Promise<void> {
    const key = this.getMetricsKey(scope, dateRange);
    await this.cache.set(key, metrics, this.CACHE_TTL);
  }

  /**
   * Invalidate metrics cache for a scope
   */
  async invalidateMetrics(scope: string): Promise<void> {
    const pattern = `${this.METRICS_KEY_PREFIX}:${scope}:*`;
    await this.cache.deletePattern(pattern);
  }

  /**
   * Compute metrics incrementally using last processed ID
   */
  async computeIncrementalMetrics(
    scope: string,
    lastProcessedId?: string
  ): Promise<Partial<PrecomputedMetrics>> {
    const baseMetrics = await this.getMetrics(scope);
    const lastId = lastProcessedId || baseMetrics?.lastProcessedId;

    // Get only new records since last processed
    const matchFilter: Record<string, unknown> = {
      deletedAt: null,
    };

    if (lastId) {
      matchFilter._id = { $gt: new mongoose.Types.ObjectId(lastId) };
    }

    // Compute incremental updates
    const [
      newPurchaseRequests,
      newContracts,
      newBids,
      newPayments,
      newDisputes,
      newRFQs,
    ] = await Promise.all([
      PurchaseRequest.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            maxId: { $max: '$_id' },
          },
        },
      ]),
      Contract.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalValue: { $sum: '$amounts.total' },
            maxId: { $max: '$_id' },
          },
        },
      ]),
      Bid.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            maxId: { $max: '$_id' },
          },
        },
      ]),
      Payment.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            maxId: { $max: '$_id' },
          },
        },
      ]),
      Dispute.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            maxId: { $max: '$_id' },
          },
        },
      ]),
      RFQ.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            maxId: { $max: '$_id' },
          },
        },
      ]),
    ]);

    const prData = newPurchaseRequests[0] || { count: 0, maxId: null };
    const contractData = newContracts[0] || { count: 0, totalValue: 0, maxId: null };
    const bidData = newBids[0] || { count: 0, maxId: null };
    const paymentData = newPayments[0] || { count: 0, totalAmount: 0, maxId: null };
    const disputeData = newDisputes[0] || { count: 0, maxId: null };
    const rfqData = newRFQs[0] || { count: 0, maxId: null };

    // Find the maximum ID across all collections
    const maxIds = [
      prData.maxId,
      contractData.maxId,
      bidData.maxId,
      paymentData.maxId,
      disputeData.maxId,
      rfqData.maxId,
    ].filter(Boolean);

    const newLastProcessedId = maxIds.length > 0
      ? maxIds.reduce((max, id) => (id > max ? id : max)).toString()
      : lastId;

    return {
      timestamp: new Date(),
      kpis: {
        totalPurchaseRequests: prData.count,
        totalContracts: contractData.count,
        totalBids: bidData.count,
        totalPayments: paymentData.count,
        totalDisputes: disputeData.count,
        activeCompanies: 0, // Would need separate query
        totalRFQs: rfqData.count,
        totalContractValue: contractData.totalValue || 0,
        totalPaymentVolume: paymentData.totalAmount || 0,
      },
      lastProcessedId: newLastProcessedId,
    };
  }

  /**
   * Merge incremental metrics with base metrics
   */
  mergeMetrics(
    base: PrecomputedMetrics,
    incremental: Partial<PrecomputedMetrics>
  ): PrecomputedMetrics {
    return {
      timestamp: incremental.timestamp || base.timestamp,
      kpis: {
        totalPurchaseRequests: base.kpis.totalPurchaseRequests + (incremental.kpis?.totalPurchaseRequests || 0),
        totalContracts: base.kpis.totalContracts + (incremental.kpis?.totalContracts || 0),
        totalBids: base.kpis.totalBids + (incremental.kpis?.totalBids || 0),
        totalPayments: base.kpis.totalPayments + (incremental.kpis?.totalPayments || 0),
        totalDisputes: base.kpis.totalDisputes + (incremental.kpis?.totalDisputes || 0),
        activeCompanies: incremental.kpis?.activeCompanies || base.kpis.activeCompanies,
        totalRFQs: base.kpis.totalRFQs + (incremental.kpis?.totalRFQs || 0),
        totalContractValue: base.kpis.totalContractValue + (incremental.kpis?.totalContractValue || 0),
        totalPaymentVolume: base.kpis.totalPaymentVolume + (incremental.kpis?.totalPaymentVolume || 0),
      },
      lastProcessedId: incremental.lastProcessedId || base.lastProcessedId,
    };
  }
}

export const metricsStore = new MetricsStore();
