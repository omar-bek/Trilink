import { Role } from '../../config/rbac';
import { RFQRepository } from '../rfqs/repository';
import { BidRepository } from '../bids/repository';
import { ContractRepository } from '../contracts/repository';
import { ShipmentRepository } from '../shipments/repository';
import { PaymentRepository } from '../payments/repository';
import { DisputeRepository } from '../disputes/repository';
import { PurchaseRequestRepository } from '../purchase-requests/repository';
import { RFQStatus } from '../rfqs/schema';
import { BidStatus } from '../bids/schema';
import { ContractStatus } from '../contracts/schema';
import { PaymentStatus } from '../payments/schema';
import { PurchaseRequestStatus } from '../purchase-requests/schema';
import mongoose from 'mongoose';

export interface DashboardKPIs {
  // Buyer KPIs
  totalPurchaseRequests?: number;
  activePurchaseRequests?: number;
  rfqsPendingResponse?: number;
  totalContractValue?: number;
  overduePaymentsCount?: number;
  overduePaymentsAmount?: number;
  pendingApprovals?: number;
  
  // Provider KPIs (Supplier, Service Provider, Logistics, Clearance)
  availableRFQs?: number;
  pendingBids?: number;
  activeContracts?: number;
  monthlyRevenue?: number;
  pendingPaymentsCount?: number;
  pendingPaymentsAmount?: number;
  
  // Common KPIs
  totalRFQs?: number;
  totalBids?: number;
  totalContracts?: number;
  totalShipments?: number;
  totalPayments?: number;
  totalDisputes?: number;
  activeCompanies?: number;
}

export interface DashboardCharts {
  purchaseRequestsByStatus?: Record<string, number>;
  rfqsByStatus?: Record<string, number>;
  contractValueTrend?: Array<{ name: string; value: number }>;
  bidAcceptanceRate?: Record<string, number>;
  activeRFQs?: Array<{ name: string; value: number }>;
  bidPerformance?: Array<{ name: string; accepted: number; rejected: number }>;
  shipmentsByStatus?: Record<string, number>;
  gpsTracking?: Record<string, number>;
  deliveryPerformance?: Array<{ name: string; onTime: number; delayed: number }>;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  charts?: DashboardCharts;
}

export class DashboardService {
  private rfqRepository: RFQRepository;
  private bidRepository: BidRepository;
  private contractRepository: ContractRepository;
  private shipmentRepository: ShipmentRepository;
  private paymentRepository: PaymentRepository;
  private disputeRepository: DisputeRepository;
  private purchaseRequestRepository: PurchaseRequestRepository;

  constructor() {
    this.rfqRepository = new RFQRepository();
    this.bidRepository = new BidRepository();
    this.contractRepository = new ContractRepository();
    this.shipmentRepository = new ShipmentRepository();
    this.paymentRepository = new PaymentRepository();
    this.disputeRepository = new DisputeRepository();
    this.purchaseRequestRepository = new PurchaseRequestRepository();
  }

  /**
   * Get dashboard data for a user based on their role and company
   */
  async getDashboardData(userId: string, companyId: string, role: Role): Promise<DashboardData> {
    const companyObjectId = new mongoose.Types.ObjectId(companyId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const kpis: DashboardKPIs = {};

    // Provider roles (Supplier, Service Provider, Logistics, Clearance)
    if (role === Role.SUPPLIER || role === Role.SERVICE_PROVIDER || role === Role.LOGISTICS || role === Role.CLEARANCE) {
      // Available RFQs - RFQs that target this role or company
      try {
        const availableRFQs = await this.rfqRepository.findByTargetRole(
          role,
          { status: RFQStatus.OPEN },
          companyId
        );
        kpis.availableRFQs = availableRFQs.length;
      } catch (error) {
        kpis.availableRFQs = 0;
      }

      // Bids Awaiting Response - submitted or under_review bids
      try {
        const bids = await this.bidRepository.findByCompanyId(companyId, {
          status: BidStatus.SUBMITTED,
        });
        const underReviewBids = await this.bidRepository.findByCompanyId(companyId, {
          status: BidStatus.UNDER_REVIEW,
        });
        kpis.pendingBids = bids.length + underReviewBids.length;
      } catch (error) {
        kpis.pendingBids = 0;
      }

      // Active Contracts
      try {
        const contracts = await this.contractRepository.findByCompanyId(companyId, {
          status: ContractStatus.ACTIVE,
        });
        kpis.activeContracts = contracts.length;
      } catch (error) {
        kpis.activeContracts = 0;
      }

      // Revenue This Month - completed payments this month
      try {
        const payments = await this.paymentRepository.findByCompanyId(companyId, {
          status: PaymentStatus.COMPLETED,
        });
        const monthlyPayments = payments.filter(
          (p) => p.paidDate && p.paidDate >= startOfMonth
        );
        kpis.monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
      } catch (error) {
        kpis.monthlyRevenue = 0;
      }

      // Payments Pending - pending_approval or processing
      try {
        const payments = await this.paymentRepository.findByCompanyId(companyId);
        const pendingPayments = payments.filter(
          (p) => p.status === PaymentStatus.PENDING_APPROVAL || p.status === PaymentStatus.PROCESSING
        );
        kpis.pendingPaymentsCount = pendingPayments.length;
        kpis.pendingPaymentsAmount = pendingPayments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
      } catch (error) {
        kpis.pendingPaymentsCount = 0;
        kpis.pendingPaymentsAmount = 0;
      }
    }

    // Buyer role and Company Manager (managers see their company's buyer metrics)
    if (role === Role.BUYER || role === Role.COMPANY_MANAGER || role === Role.ADMIN || role === Role.GOVERNMENT) {
      // Active Purchase Requests
      try {
        const purchaseRequests = await this.purchaseRequestRepository.findByCompanyId(companyId);
        const activePRs = purchaseRequests.filter(
          (pr) => pr.status === PurchaseRequestStatus.APPROVED || pr.status === PurchaseRequestStatus.SUBMITTED
        );
        kpis.activePurchaseRequests = activePRs.length;
        kpis.totalPurchaseRequests = purchaseRequests.length;
      } catch (error) {
        kpis.activePurchaseRequests = 0;
        kpis.totalPurchaseRequests = 0;
      }

      // RFQs Pending Response - open RFQs
      try {
        const rfqs = await this.rfqRepository.findByCompanyId(companyId, {
          status: RFQStatus.OPEN,
        });
        kpis.rfqsPendingResponse = rfqs.length;
      } catch (error) {
        kpis.rfqsPendingResponse = 0;
      }

      // Total Contract Value - sum of active contracts
      try {
        const contracts = await this.contractRepository.findByCompanyId(companyId, {
          status: ContractStatus.ACTIVE,
        });
        kpis.totalContractValue = contracts.reduce((sum, c) => sum + (c.amounts?.total || 0), 0);
        kpis.totalContracts = contracts.length;
      } catch (error) {
        kpis.totalContractValue = 0;
        kpis.totalContracts = 0;
      }

      // Overdue Payments
      try {
        const payments = await this.paymentRepository.findByCompanyId(companyId);
        const overduePayments = payments.filter(
          (p) => p.dueDate < now && p.status !== PaymentStatus.COMPLETED && p.status !== PaymentStatus.CANCELLED
        );
        kpis.overduePaymentsCount = overduePayments.length;
        kpis.overduePaymentsAmount = overduePayments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
      } catch (error) {
        kpis.overduePaymentsCount = 0;
        kpis.overduePaymentsAmount = 0;
      }

      // Payments Awaiting Approval
      try {
        const payments = await this.paymentRepository.findByCompanyId(companyId);
        const pendingApprovals = payments.filter(
          (p) => p.status === PaymentStatus.PENDING_APPROVAL
        );
        kpis.pendingApprovals = pendingApprovals.length;
      } catch (error) {
        kpis.pendingApprovals = 0;
      }
    }

    // Common KPIs for all roles
    try {
      const bids = await this.bidRepository.findByCompanyId(companyId);
      kpis.totalBids = bids.length;
    } catch (error) {
      kpis.totalBids = 0;
    }

    try {
      const shipments = await this.shipmentRepository.findByCompanyId(companyId);
      kpis.totalShipments = shipments.length;
    } catch (error) {
      kpis.totalShipments = 0;
    }

    try {
      const payments = await this.paymentRepository.findByCompanyId(companyId);
      kpis.totalPayments = payments.length;
    } catch (error) {
      kpis.totalPayments = 0;
    }

    try {
      const disputes = await this.disputeRepository.findByCompanyId(companyId);
      kpis.totalDisputes = disputes.length;
    } catch (error) {
      kpis.totalDisputes = 0;
    }

    // Generate charts data
    const charts: DashboardCharts = {};

    // Buyer charts (also for Company Manager)
    if (role === Role.BUYER || role === Role.COMPANY_MANAGER || role === Role.ADMIN || role === Role.GOVERNMENT) {
      try {
        // Purchase Requests by Status
        const purchaseRequests = await this.purchaseRequestRepository.findByCompanyId(companyId);
        const prsByStatus: Record<string, number> = {};
        purchaseRequests.forEach((pr) => {
          const status = pr.status || 'unknown';
          prsByStatus[status] = (prsByStatus[status] || 0) + 1;
        });
        charts.purchaseRequestsByStatus = prsByStatus;

        // RFQs by Status
        const rfqs = await this.rfqRepository.findByCompanyId(companyId);
        const rfqsByStatus: Record<string, number> = {};
        rfqs.forEach((rfq) => {
          const status = rfq.status || 'unknown';
          rfqsByStatus[status] = (rfqsByStatus[status] || 0) + 1;
        });
        charts.rfqsByStatus = rfqsByStatus;

        // Contract Value Trend (last 6 months)
        const contracts = await this.contractRepository.findByCompanyId(companyId);
        const contractTrend: Array<{ name: string; value: number }> = [];
        const last6Months: Date[] = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          last6Months.push(date);
        }

        last6Months.forEach((monthStart) => {
          const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
          const monthContracts = contracts.filter((c) => {
            const contractDate = c.createdAt || c.startDate;
            return contractDate >= monthStart && contractDate <= monthEnd;
          });
          const monthValue = monthContracts.reduce((sum, c) => sum + (c.amounts?.total || 0), 0);
          const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          contractTrend.push({ name: monthLabel, value: monthValue });
        });
        charts.contractValueTrend = contractTrend;
      } catch (error) {
        // Continue if error
      }
    }

    // Supplier/Service Provider charts
    if (role === Role.SUPPLIER || role === Role.SERVICE_PROVIDER) {
      try {
        // Bid Acceptance Rate
        const bids = await this.bidRepository.findByCompanyId(companyId);
        const bidStats: Record<string, number> = {
          accepted: 0,
          rejected: 0,
          pending: 0,
          withdrawn: 0,
        };
        bids.forEach((bid) => {
          if (bid.status === BidStatus.ACCEPTED) bidStats.accepted++;
          else if (bid.status === BidStatus.REJECTED) bidStats.rejected++;
          else if (bid.status === BidStatus.SUBMITTED || bid.status === BidStatus.UNDER_REVIEW) bidStats.pending++;
          else if (bid.status === BidStatus.WITHDRAWN) bidStats.withdrawn++;
        });
        charts.bidAcceptanceRate = bidStats;

        // Active RFQs (last 6 months)
        const availableRFQs = await this.rfqRepository.findByTargetRole(
          role,
          { status: RFQStatus.OPEN },
          companyId
        );
        const rfqTrend: Array<{ name: string; value: number }> = [];
        const last6Months: Date[] = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          last6Months.push(date);
        }

        last6Months.forEach((monthStart) => {
          const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
          const monthRFQs = availableRFQs.filter((rfq) => {
            const rfqDate = rfq.createdAt;
            return rfqDate >= monthStart && rfqDate <= monthEnd;
          });
          const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          rfqTrend.push({ name: monthLabel, value: monthRFQs.length });
        });
        charts.activeRFQs = rfqTrend;

        // Bid Performance (last 6 months)
        const bidPerformance: Array<{ name: string; accepted: number; rejected: number }> = [];
        last6Months.forEach((monthStart) => {
          const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
          const monthBids = bids.filter((bid) => {
            const bidDate = bid.createdAt;
            return bidDate >= monthStart && bidDate <= monthEnd;
          });
          const accepted = monthBids.filter((b) => b.status === BidStatus.ACCEPTED).length;
          const rejected = monthBids.filter((b) => b.status === BidStatus.REJECTED).length;
          const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          bidPerformance.push({ name: monthLabel, accepted, rejected });
        });
        charts.bidPerformance = bidPerformance;
      } catch (error) {
        // Continue if error
      }
    }

    // Logistics charts
    if (role === Role.LOGISTICS) {
      try {
        // Shipments by Status
        const shipments = await this.shipmentRepository.findByCompanyId(companyId);
        const shipmentsByStatus: Record<string, number> = {};
        shipments.forEach((shipment) => {
          const status = shipment.status || 'unknown';
          shipmentsByStatus[status] = (shipmentsByStatus[status] || 0) + 1;
        });
        charts.shipmentsByStatus = shipmentsByStatus;

        // GPS Tracking Overview
        const trackedCount = shipments.filter((s) => s.trackingNumber).length;
        const notTrackedCount = shipments.filter((s) => !s.trackingNumber).length;
        charts.gpsTracking = {
          tracked: trackedCount,
          not_tracked: notTrackedCount,
        };

        // Delivery Performance (last 6 months)
        const deliveryPerformance: Array<{ name: string; onTime: number; delayed: number }> = [];
        const last6Months: Date[] = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          last6Months.push(date);
        }

        last6Months.forEach((monthStart) => {
          const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
          const monthShipments = shipments.filter((s) => {
            const deliveryDate = s.actualDeliveryDate || s.expectedDeliveryDate;
            return deliveryDate >= monthStart && deliveryDate <= monthEnd;
          });
          const onTime = monthShipments.filter((s) => {
            if (!s.actualDeliveryDate || !s.expectedDeliveryDate) return false;
            return s.actualDeliveryDate <= s.expectedDeliveryDate;
          }).length;
          const delayed = monthShipments.filter((s) => {
            if (!s.actualDeliveryDate || !s.expectedDeliveryDate) return false;
            return s.actualDeliveryDate > s.expectedDeliveryDate;
          }).length;
          const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          deliveryPerformance.push({ name: monthLabel, onTime, delayed });
        });
        charts.deliveryPerformance = deliveryPerformance;
      } catch (error) {
        // Continue if error
      }
    }

    return {
      kpis,
      charts: Object.keys(charts).length > 0 ? charts : undefined,
    };
  }
}
