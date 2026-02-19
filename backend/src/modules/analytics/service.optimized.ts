import { Readable } from 'stream';
import { PurchaseRequest } from '../purchase-requests/schema';
import { Contract } from '../contracts/schema';
import { Bid } from '../bids/schema';
import { Payment } from '../payments/schema';
import { Dispute } from '../disputes/schema';
import { Company } from '../companies/schema';
import { RFQ } from '../rfqs/schema';
import { AppError } from '../../middlewares/error.middleware';
import { CacheService } from '../../utils/cache';
import { metricsStore } from './metrics-store';
import {
  purchaseRequestAggregations,
  contractAggregations,
  bidAggregations,
  paymentAggregations,
  disputeAggregations,
  companyAggregations,
  rfqAggregations,
  AnalyticsFilters,
} from './aggregations';
import { logger } from '../../utils/logger';

export interface AnalyticsResponse {
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
    completedPaymentVolume: number;
    pendingPaymentVolume: number;
    averageContractValue: number;
    averagePaymentAmount: number;
  };
  purchaseRequests: {
    byStatus: Record<string, number>;
    byMonth: Array<{ month: string; count: number }>;
  };
  contracts: {
    byStatus: Record<string, number>;
    totalValue: number;
    averageValue: number;
    byMonth: Array<{ month: string; count: number; value: number }>;
  };
  bids: {
    totalSubmitted: number;
    totalAccepted: number;
    acceptanceRate: number;
    averageAIScore: number;
    totalBidValue: number;
    averageBidValue: number;
  };
  payments: {
    totalAmount: number;
    byStatus: Record<string, number>;
    volumeByStatus: Record<string, number>;
    pendingAmount: number;
    completedAmount: number;
    byMonth: Array<{ month: string; count: number; amount: number }>;
  };
  disputes: {
    total: number;
    escalated: number;
    resolutionRate: number;
    byType: Record<string, number>;
  };
  companies: {
    byType: Record<string, number>;
    active: number;
  };
  rfqs: {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  };
}

/**
 * Optimized Analytics Service
 * Uses aggregation pipelines, Redis caching, incremental metrics, and streaming
 */
export class OptimizedAnalyticsService {
  private cache: CacheService;
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor() {
    this.cache = new CacheService('analytics');
  }

  /**
   * Get cache key for analytics
   */
  private getCacheKey(scope: string, filters: AnalyticsFilters): string {
    const filterStr = JSON.stringify({
      companyId: filters.companyId,
      startDate: filters.startDate?.toISOString(),
      endDate: filters.endDate?.toISOString(),
    });
    return `analytics:${scope}:${Buffer.from(filterStr).toString('base64')}`;
  }

  /**
   * Get government analytics with optimizations
   */
  async getGovernmentAnalytics(filters?: AnalyticsFilters): Promise<AnalyticsResponse> {
    const cacheKey = this.getCacheKey('government', filters || {});
    
    // Try cache first
    const cached = await this.cache.get<AnalyticsResponse>(cacheKey);
    if (cached) {
      logger.debug('Analytics cache hit');
      return cached;
    }

    try {
      // Use precomputed metrics if no date range filter
      if (!filters?.startDate && !filters?.endDate) {
        const precomputed = await metricsStore.getMetrics('government');
        if (precomputed) {
          // Merge with real-time aggregation data
          const realTimeData = await this.computeRealTimeMetrics(filters);
          const result = this.mergePrecomputedWithRealTime(precomputed, realTimeData);
          await this.cache.set(cacheKey, result, this.CACHE_TTL);
          return result;
        }
      }

      // Compute using aggregation pipelines
      const result = await this.computeAnalytics(filters);
      await this.cache.set(cacheKey, result, this.CACHE_TTL);
      return result;
    } catch (error) {
      logger.error('Error computing government analytics:', error);
      throw new AppError('Failed to generate analytics', 500);
    }
  }

  /**
   * Get company analytics with optimizations
   */
  async getCompanyAnalytics(companyId: string, filters?: AnalyticsFilters): Promise<Partial<AnalyticsResponse>> {
    const cacheKey = this.getCacheKey(`company:${companyId}`, filters || {});
    
    // Try cache first
    const cached = await this.cache.get<Partial<AnalyticsResponse>>(cacheKey);
    if (cached) {
      logger.debug('Company analytics cache hit');
      return cached;
    }

    try {
      const companyFilters: AnalyticsFilters = { ...filters, companyId };
      const result = await this.computeAnalytics(companyFilters);
      await this.cache.set(cacheKey, result, this.CACHE_TTL);
      return result;
    } catch (error) {
      logger.error('Error computing company analytics:', error);
      throw new AppError('Failed to generate company analytics', 500);
    }
  }

  /**
   * Compute analytics using aggregation pipelines
   */
  private async computeAnalytics(filters: AnalyticsFilters = {}): Promise<AnalyticsResponse> {
    const [
      purchaseRequestData,
      contractData,
      bidData,
      paymentData,
      disputeData,
      companyData,
      rfqData,
    ] = await Promise.all([
      PurchaseRequest.aggregate(purchaseRequestAggregations.getKPIs(filters)),
      Contract.aggregate(contractAggregations.getKPIs(filters)),
      Bid.aggregate(bidAggregations.getKPIs(filters)),
      Payment.aggregate(paymentAggregations.getKPIs(filters)),
      Dispute.aggregate(disputeAggregations.getKPIs(filters)),
      Company.aggregate(companyAggregations.getKPIs(filters)),
      RFQ.aggregate(rfqAggregations.getKPIs(filters)),
    ]);

    // Process Purchase Requests
    const prFacet = purchaseRequestData[0] || {};
    const prTotal = prFacet.total?.[0]?.count || 0;
    const prByStatus = this.arrayToRecord(prFacet.byStatus || [], 'status', 'count');
    const prByMonth = prFacet.byMonth || [];

    // Process Contracts
    const contractFacet = contractData[0] || {};
    const contractTotal = contractFacet.total?.[0]?.count || 0;
    const contractByStatus = this.arrayToRecord(contractFacet.byStatus || [], 'status', 'count');
    const contractValueStats = contractFacet.valueStats?.[0] || {};
    const contractTotalValue = contractValueStats.totalValue || 0;
    const contractAverageValue = contractValueStats.averageValue || 0;
    const contractByMonth = contractFacet.byMonth || [];

    // Process Bids
    const bidFacet = bidData[0] || {};
    const bidTotal = bidFacet.total?.[0]?.count || 0;
    const bidByStatus = this.arrayToRecord(bidFacet.byStatus || [], 'status', 'count');
    const bidStats = bidFacet.stats?.[0] || {};
    const bidTotalSubmitted = bidStats.totalSubmitted || 0;
    const bidTotalAccepted = bidStats.totalAccepted || 0;
    const bidAcceptanceRate = bidStats.totalBids > 0
      ? (bidTotalAccepted / bidStats.totalBids) * 100
      : 0;
    const bidAverageAIScore = bidStats.averageAIScore || 0;
    const bidTotalValue = bidStats.totalBidValue || 0;
    const bidAverageValue = bidStats.averageBidValue || 0;

    // Process Payments
    const paymentFacet = paymentData[0] || {};
    const paymentTotal = paymentFacet.total?.[0]?.count || 0;
    const paymentByStatus = this.arrayToRecord(paymentFacet.byStatus || [], 'status', 'count');
    const paymentVolumeByStatus = this.arrayToRecord(
      paymentFacet.byStatus || [],
      'status',
      'amount'
    );
    const paymentStats = paymentFacet.stats?.[0] || {};
    const paymentTotalAmount = paymentStats.totalAmount || 0;
    const paymentPendingAmount = paymentStats.pendingAmount || 0;
    const paymentCompletedAmount = paymentStats.completedAmount || 0;
    const paymentByMonth = paymentFacet.byMonth || [];

    // Process Disputes
    const disputeFacet = disputeData[0] || {};
    const disputeTotal = disputeFacet.total?.[0]?.count || 0;
    const disputeStats = disputeFacet.stats?.[0] || {};
    const disputeEscalated = disputeStats.escalated || 0;
    const disputeResolutionRate = disputeStats.total > 0
      ? (disputeStats.resolved / disputeStats.total) * 100
      : 0;
    const disputeByType = this.arrayToRecord(disputeFacet.byType || [], 'type', 'count');

    // Process Companies
    const companyFacet = companyData[0] || {};
    const companyByType = this.arrayToRecord(companyFacet.byType || [], 'type', 'count');
    const companyActive = companyFacet.active?.[0]?.count || 0;

    // Process RFQs
    const rfqFacet = rfqData[0] || {};
    const rfqTotal = rfqFacet.total?.[0]?.count || 0;
    const rfqByStatus = this.arrayToRecord(rfqFacet.byStatus || [], 'status', 'count');
    const rfqByType = this.arrayToRecord(rfqFacet.byType || [], 'type', 'count');

    return {
      kpis: {
        totalPurchaseRequests: prTotal,
        totalContracts: contractTotal,
        totalBids: bidTotal,
        totalPayments: paymentTotal,
        totalDisputes: disputeTotal,
        activeCompanies: companyActive,
        totalRFQs: rfqTotal,
        totalContractValue: contractTotalValue,
        totalPaymentVolume: paymentTotalAmount,
        completedPaymentVolume: paymentCompletedAmount,
        pendingPaymentVolume: paymentPendingAmount,
        averageContractValue: contractAverageValue,
        averagePaymentAmount: paymentTotal > 0 ? paymentTotalAmount / paymentTotal : 0,
      },
      purchaseRequests: {
        byStatus: prByStatus,
        byMonth: prByMonth,
      },
      contracts: {
        byStatus: contractByStatus,
        totalValue: contractTotalValue,
        averageValue: contractAverageValue,
        byMonth: contractByMonth,
      },
      bids: {
        totalSubmitted: bidTotalSubmitted,
        totalAccepted: bidTotalAccepted,
        acceptanceRate: bidAcceptanceRate,
        averageAIScore: Math.round(bidAverageAIScore * 100) / 100,
        totalBidValue: bidTotalValue,
        averageBidValue: Math.round(bidAverageValue * 100) / 100,
      },
      payments: {
        totalAmount: paymentTotalAmount,
        byStatus: paymentByStatus,
        volumeByStatus: paymentVolumeByStatus,
        pendingAmount: paymentPendingAmount,
        completedAmount: paymentCompletedAmount,
        byMonth: paymentByMonth,
      },
      disputes: {
        total: disputeTotal,
        escalated: disputeEscalated,
        resolutionRate: disputeResolutionRate,
        byType: disputeByType,
      },
      companies: {
        byType: companyByType,
        active: companyActive,
      },
      rfqs: {
        total: rfqTotal,
        byStatus: rfqByStatus,
        byType: rfqByType,
      },
    };
  }

  /**
   * Compute real-time metrics for merging with precomputed
   */
  private async computeRealTimeMetrics(filters?: AnalyticsFilters): Promise<Partial<AnalyticsResponse>> {
    // Compute only what changes frequently
    const [paymentData, disputeData] = await Promise.all([
      Payment.aggregate(paymentAggregations.getKPIs(filters || {})),
      Dispute.aggregate(disputeAggregations.getKPIs(filters || {})),
    ]);

    const paymentFacet = paymentData[0] || {};
    const paymentStats = paymentFacet.stats?.[0] || {};
    const disputeFacet = disputeData[0] || {};
    const disputeStats = disputeFacet.stats?.[0] || {};

    return {
      payments: {
        totalAmount: paymentStats.totalAmount || 0,
        byStatus: {},
        volumeByStatus: {},
        pendingAmount: paymentStats.pendingAmount || 0,
        completedAmount: paymentStats.completedAmount || 0,
        byMonth: [],
      },
      disputes: {
        total: disputeStats.total || 0,
        escalated: disputeStats.escalated || 0,
        resolutionRate: disputeStats.total > 0
          ? (disputeStats.resolved / disputeStats.total) * 100
          : 0,
        byType: {},
      },
    };
  }

  /**
   * Merge precomputed metrics with real-time data
   */
  private mergePrecomputedWithRealTime(
    precomputed: any,
    realTime: Partial<AnalyticsResponse>
  ): AnalyticsResponse {
    return {
      ...precomputed,
      payments: realTime.payments || precomputed.payments,
      disputes: realTime.disputes || precomputed.disputes,
    } as AnalyticsResponse;
  }

  /**
   * Stream large datasets for export/processing
   */
  streamPurchaseRequests(filters: AnalyticsFilters = {}): Readable {
    const match = this.buildMatch(filters);
    const cursor = PurchaseRequest.find(match).lean().cursor();

    return Readable.from(cursor);
  }

  streamContracts(filters: AnalyticsFilters = {}): Readable {
    const match: Record<string, unknown> = {
      deletedAt: null,
    };

    if (filters.companyId) {
      match.buyerCompanyId = filters.companyId;
    }

    if (filters.startDate || filters.endDate) {
      match.createdAt = {};
      if (filters.startDate) match.createdAt.$gte = filters.startDate;
      if (filters.endDate) match.createdAt.$lte = filters.endDate;
    }

    const cursor = Contract.find(match).lean().cursor();
    return Readable.from(cursor);
  }

  streamBids(filters: AnalyticsFilters = {}): Readable {
    const match = this.buildMatch(filters);
    const cursor = Bid.find(match).lean().cursor();
    return Readable.from(cursor);
  }

  streamPayments(filters: AnalyticsFilters = {}): Readable {
    const match: Record<string, unknown> = {
      deletedAt: null,
    };

    if (filters.companyId) {
      match.$or = [
        { companyId: filters.companyId },
        { recipientCompanyId: filters.companyId },
      ];
    }

    if (filters.startDate || filters.endDate) {
      match.createdAt = {};
      if (filters.startDate) match.createdAt.$gte = filters.startDate;
      if (filters.endDate) match.createdAt.$lte = filters.endDate;
    }

    const cursor = Payment.find(match).lean().cursor();
    return Readable.from(cursor);
  }

  /**
   * Build match filter for queries
   */
  private buildMatch(filters: AnalyticsFilters): Record<string, unknown> {
    const match: Record<string, unknown> = {
      deletedAt: null,
    };

    if (filters.companyId) {
      match.companyId = filters.companyId;
    }

    if (filters.startDate || filters.endDate) {
      match.createdAt = {};
      if (filters.startDate) match.createdAt.$gte = filters.startDate;
      if (filters.endDate) match.createdAt.$lte = filters.endDate;
    }

    return match;
  }

  /**
   * Helper to convert array to record
   */
  private arrayToRecord<T extends Record<string, any>>(
    array: T[],
    keyField: keyof T,
    valueField: keyof T
  ): Record<string, number> {
    return array.reduce((acc, item) => {
      const key = String(item[keyField]);
      const value = Number(item[valueField]) || 0;
      acc[key] = value;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Invalidate cache for analytics
   */
  async invalidateCache(scope?: string): Promise<void> {
    if (scope) {
      await this.cache.deletePattern(`analytics:${scope}:*`);
    } else {
      await this.cache.deletePattern('analytics:*');
    }
  }
}
