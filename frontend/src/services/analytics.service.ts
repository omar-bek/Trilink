import api from './api';
import { ApiResponse } from '@/types';

export interface GovernmentAnalytics {
  kpis: {
    totalPurchaseRequests: number;
    totalContracts: number;
    totalBids: number;
    totalPayments: number;
    totalDisputes: number;
    totalRFQs: number;
    activeCompanies: number;
    totalContractValue: number;
    totalPaymentAmount: number;
    totalCompletedPaymentAmount: number;
    totalPendingPaymentAmount: number;
    escalatedDisputes: number;
    activeShipments: number;
  };
  charts: {
    purchaseRequestsByMonth?: Array<{ month: string; count: number }>;
    contractsByStatus?: Record<string, number>;
    paymentsByStatus?: Record<string, number>;
    disputesByType?: Record<string, number>;
    contractsByMonth?: Array<{ month: string; count: number; value: number }>;
    paymentsByMonth?: Array<{ month: string; count: number; amount: number }>;
    companiesByType?: Record<string, number>;
  };
  trends: {
    contractValueTrend?: number;
    paymentAmountTrend?: number;
    disputeResolutionRate?: number;
  };
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  companyType?: string;
  status?: string;
}

export interface CompanyAnalytics {
  kpis: {
    totalPurchaseRequests?: number;
    totalContracts?: number;
    totalBids?: number;
    totalPayments?: number;
    totalDisputes?: number;
    totalRFQs?: number;
    activeShipments?: number;
    totalContractValue?: number;
    totalPaymentAmount?: number;
  };
  charts: {
    purchaseRequestsByMonth?: Array<{ month: string; count: number }>;
    contractsByStatus?: Record<string, number>;
    paymentsByStatus?: Record<string, number>;
    bidsByStatus?: Record<string, number>;
    contractsByMonth?: Array<{ month: string; count: number; value: number }>;
    paymentsByMonth?: Array<{ month: string; count: number; amount: number }>;
  };
  trends: {
    contractValueTrend?: number;
    paymentAmountTrend?: number;
    bidAcceptanceRate?: number;
  };
}

export const analyticsService = {
  getGovernmentAnalytics: async (filters?: AnalyticsFilters): Promise<ApiResponse<GovernmentAnalytics>> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.companyType) params.append('companyType', filters.companyType);
    if (filters?.status) params.append('status', filters.status);

    const response = await api.get<ApiResponse<GovernmentAnalytics>>(
      `/analytics/government?${params.toString()}`
    );
    return response.data;
  },

  getCompanyAnalytics: async (filters?: AnalyticsFilters): Promise<ApiResponse<CompanyAnalytics>> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.status) params.append('status', filters.status);

    const response = await api.get<ApiResponse<CompanyAnalytics>>(
      `/analytics/company?${params.toString()}`
    );
    return response.data;
  },

  streamPurchaseRequests: async (filters?: AnalyticsFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.status) params.append('status', filters.status);

    const response = await api.get(`/analytics/stream/purchase-requests?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
