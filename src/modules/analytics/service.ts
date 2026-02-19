import { PurchaseRequestRepository } from '../purchase-requests/repository';
import { ContractRepository } from '../contracts/repository';
import { BidRepository } from '../bids/repository';
import { PaymentRepository } from '../payments/repository';
import { DisputeRepository } from '../disputes/repository';
import { CompanyRepository } from '../companies/repository';
import { AppError } from '../../middlewares/error.middleware';

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
  private purchaseRequestRepository: PurchaseRequestRepository;
  private contractRepository: ContractRepository;
  private bidRepository: BidRepository;
  private paymentRepository: PaymentRepository;
  private disputeRepository: DisputeRepository;
  private companyRepository: CompanyRepository;

  constructor() {
    this.purchaseRequestRepository = new PurchaseRequestRepository();
    this.contractRepository = new ContractRepository();
    this.bidRepository = new BidRepository();
    this.paymentRepository = new PaymentRepository();
    this.disputeRepository = new DisputeRepository();
    this.companyRepository = new CompanyRepository();
  }

  /**
   * Get government analytics (aggregated metrics)
   */
  async getGovernmentAnalytics(): Promise<AnalyticsResponse> {
    try {
      // Get all data (no company filtering for government)
      const [
        purchaseRequests,
        contracts,
        bids,
        payments,
        disputes,
        companies,
      ] = await Promise.all([
        this.purchaseRequestRepository.findByCompanyId(''), // Would need to modify to get all
        this.contractRepository.findByCompanyId(''),
        this.bidRepository.findByCompanyId(''),
        this.paymentRepository.findByCompanyId(''),
        this.disputeRepository.findByCompanyId(''),
        this.companyRepository.findByTypeAndStatus(),
      ]);

      // Calculate KPIs
      const kpis = {
        totalPurchaseRequests: purchaseRequests.length,
        totalContracts: contracts.length,
        totalBids: bids.length,
        totalPayments: payments.length,
        totalDisputes: disputes.length,
        activeCompanies: companies.filter((c) => c.status === 'active').length,
      };

      // Purchase requests analytics
      const purchaseRequestsByStatus: Record<string, number> = {};
      purchaseRequests.forEach((pr) => {
        purchaseRequestsByStatus[pr.status] =
          (purchaseRequestsByStatus[pr.status] || 0) + 1;
      });

      // Contracts analytics
      const contractsByStatus: Record<string, number> = {};
      let totalContractValue = 0;
      contracts.forEach((c) => {
        contractsByStatus[c.status] = (contractsByStatus[c.status] || 0) + 1;
        totalContractValue += c.amounts.total;
      });

      // Bids analytics
      const acceptedBids = bids.filter((b) => b.status === 'accepted').length;
      const bidsWithScore = bids.filter((b) => b.aiScore !== undefined);
      const averageAIScore =
        bidsWithScore.length > 0
          ? bidsWithScore.reduce((sum, b) => sum + (b.aiScore || 0), 0) /
            bidsWithScore.length
          : 0;

      // Payments analytics
      const paymentsByStatus: Record<string, number> = {};
      let pendingAmount = 0;
      payments.forEach((p) => {
        paymentsByStatus[p.status] = (paymentsByStatus[p.status] || 0) + 1;
        if (p.status === 'pending') {
          pendingAmount += p.amount;
        }
      });
      const totalPaymentAmount = payments.reduce((sum, p) => sum + p.amount, 0);

      // Disputes analytics
      const escalatedDisputes = disputes.filter(
        (d) => d.escalatedToGovernment
      ).length;
      const resolvedDisputes = disputes.filter(
        (d) => d.status === 'resolved'
      ).length;

      // Companies analytics
      const companiesByType: Record<string, number> = {};
      companies.forEach((c) => {
        companiesByType[c.type] = (companiesByType[c.type] || 0) + 1;
      });

      return {
        kpis,
        purchaseRequests: {
          byStatus: purchaseRequestsByStatus,
          byMonth: [], // Would need date aggregation
        },
        contracts: {
          byStatus: contractsByStatus,
          totalValue: totalContractValue,
          averageValue:
            contracts.length > 0 ? totalContractValue / contracts.length : 0,
        },
        bids: {
          totalSubmitted: bids.length,
          acceptanceRate:
            bids.length > 0 ? (acceptedBids / bids.length) * 100 : 0,
          averageAIScore: Math.round(averageAIScore * 100) / 100,
        },
        payments: {
          totalAmount: totalPaymentAmount,
          byStatus: paymentsByStatus,
          pendingAmount,
        },
        disputes: {
          total: disputes.length,
          escalated: escalatedDisputes,
          resolutionRate:
            disputes.length > 0
              ? (resolvedDisputes / disputes.length) * 100
              : 0,
        },
        companies: {
          byType: companiesByType,
          active: companies.filter((c) => c.status === 'active').length,
        },
      };
    } catch (error) {
      throw new AppError('Failed to generate analytics', 500);
    }
  }

  /**
   * Get company-specific analytics
   */
  async getCompanyAnalytics(companyId: string): Promise<Partial<AnalyticsResponse>> {
    try {
      const [
        purchaseRequests,
        contracts,
        bids,
        payments,
        disputes,
      ] = await Promise.all([
        this.purchaseRequestRepository.findByCompanyId(companyId),
        this.contractRepository.findByCompanyId(companyId),
        this.bidRepository.findByCompanyId(companyId),
        this.paymentRepository.findByCompanyId(companyId),
        this.disputeRepository.findByCompanyId(companyId),
      ]);

      return {
        kpis: {
          totalPurchaseRequests: purchaseRequests.length,
          totalContracts: contracts.length,
          totalBids: bids.length,
          totalPayments: payments.length,
          totalDisputes: disputes.length,
          activeCompanies: 0, // Not applicable for company view
        },
        purchaseRequests: {
          byStatus: {},
          byMonth: [],
        },
        contracts: {
          byStatus: {},
          totalValue: 0,
          averageValue: 0,
        },
        bids: {
          totalSubmitted: bids.length,
          acceptanceRate: 0,
          averageAIScore: 0,
        },
        payments: {
          totalAmount: 0,
          byStatus: {},
          pendingAmount: 0,
        },
        disputes: {
          total: disputes.length,
          escalated: 0,
          resolutionRate: 0,
        },
        companies: {
          byType: {},
          active: 0,
        },
      };
    } catch (error) {
      throw new AppError('Failed to generate company analytics', 500);
    }
  }
}
