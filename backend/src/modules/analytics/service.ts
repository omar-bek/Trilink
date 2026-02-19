import { OptimizedAnalyticsService } from './service.optimized';
import { AnalyticsFilters } from './aggregations';

export interface AnalyticsResponse {
  kpis: {
    totalPurchaseRequests: number;
    totalContracts: number;
    totalBids: number;
    totalPayments: number;
    totalDisputes: number;
    activeCompanies: number;
  };
  purchaseRequests: {
    byStatus: Record<string, number>;
    byMonth: Array<{ month: string; count: number }>;
  };
  contracts: {
    byStatus: Record<string, number>;
    totalValue: number;
    averageValue: number;
  };
  bids: {
    totalSubmitted: number;
    acceptanceRate: number;
    averageAIScore: number;
  };
  payments: {
    totalAmount: number;
    byStatus: Record<string, number>;
    pendingAmount: number;
  };
  disputes: {
    total: number;
    escalated: number;
    resolutionRate: number;
  };
  companies: {
    byType: Record<string, number>;
    active: number;
  };
}

export class AnalyticsService {
  private optimizedService: OptimizedAnalyticsService;

  constructor() {
    this.optimizedService = new OptimizedAnalyticsService();
  }

  /**
   * Get government analytics (aggregated metrics)
   * Uses optimized service with aggregation pipelines, caching, and incremental metrics
   */
  async getGovernmentAnalytics(filters?: AnalyticsFilters): Promise<AnalyticsResponse> {
    return this.optimizedService.getGovernmentAnalytics(filters);
  }

  /**
   * Get company-specific analytics
   * Uses optimized service with aggregation pipelines and caching
   */
  async getCompanyAnalytics(companyId: string, filters?: AnalyticsFilters): Promise<Partial<AnalyticsResponse>> {
    return this.optimizedService.getCompanyAnalytics(companyId, filters);
  }

  /**
   * Stream large datasets for export/processing
   */
  streamPurchaseRequests(filters?: AnalyticsFilters) {
    return this.optimizedService.streamPurchaseRequests(filters);
  }

  streamContracts(filters?: AnalyticsFilters) {
    return this.optimizedService.streamContracts(filters);
  }

  streamBids(filters?: AnalyticsFilters) {
    return this.optimizedService.streamBids(filters);
  }

  streamPayments(filters?: AnalyticsFilters) {
    return this.optimizedService.streamPayments(filters);
  }
}
