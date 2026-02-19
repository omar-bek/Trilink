import api from './api';
import { ApiResponse } from '@/types';
import { CriticalAlert, AlertPriority } from '@/components/Dashboard/CriticalAlertsBanner';

export interface DashboardKPIs {
  totalPurchaseRequests: number;
  totalContracts: number;
  totalBids: number;
  totalPayments: number;
  totalDisputes: number;
  activeCompanies?: number;
  totalRFQs?: number;
  activeShipments?: number;
  pendingPayments?: number;
  // Executive KPIs
  pendingApprovals?: number;
  overduePaymentsCount?: number;
  overduePaymentsAmount?: number;
  activePurchaseRequests?: number;
  totalContractValue?: number;
  contractValueTrend?: number;
  pendingBids?: number;
  activeContracts?: number;
  monthlyRevenue?: number;
  revenueTrend?: number;
  pendingPaymentsCount?: number;
  pendingPaymentsAmount?: number;
  delayedShipments?: number;
  onTimeDeliveryRate?: number;
  deliveryTrend?: number;
  shipmentsToday?: number;
  escalatedDisputes?: number;
  totalPlatformValue?: number;
  platformValueTrend?: number;
  monthlyTransactions?: number;
  systemHealth?: string;
  totalUsers?: number;
  userGrowth?: number;
  platformGrowth?: number;
  growthTrend?: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  recentActivity: RecentActivity[];
  charts?: {
    purchaseRequestsByMonth?: Array<{ month: string; count: number }>;
    contractsByStatus?: Record<string, number>;
    paymentsByStatus?: Record<string, number>;
  };
}

export const dashboardService = {
  getDashboardData: async (): Promise<ApiResponse<DashboardData>> => {
    // Use the new dashboard endpoint that works for all roles
    const response = await api.get<ApiResponse<DashboardData>>('/dashboard');
    return response.data;
  },

  getGovernmentDashboard: async (): Promise<ApiResponse<DashboardData>> => {
    // Government dashboard still uses analytics endpoint
    const response = await api.get<ApiResponse<DashboardData>>('/analytics/government');
    return response.data;
  },

  getRecentActivity: async (limit: number = 10): Promise<ApiResponse<RecentActivity[]>> => {
    try {
      // Audit endpoint returns { logs: [...], pagination: {...} }
      const response = await api.get<ApiResponse<{ logs: any[]; pagination: any }>>(`/audit?limit=${limit}`);

      // Transform audit logs to RecentActivity format
      const activities: RecentActivity[] = (response.data.data?.logs || []).map((log) => {
        const actionMap: Record<string, string> = {
          CREATE: 'created',
          UPDATE: 'updated',
          DELETE: 'deleted',
          VIEW: 'viewed',
        };

        const resourceMap: Record<string, string> = {
          purchase_request: 'Purchase Request',
          rfq: 'RFQ',
          bid: 'Bid',
          contract: 'Contract',
          shipment: 'Shipment',
          payment: 'Payment',
          dispute: 'Dispute',
        };

        const action = actionMap[log.action] || log.action?.toLowerCase() || 'viewed';
        const resource = resourceMap[log.resource?.toLowerCase()] || log.resource || 'Item';

        return {
          id: log._id || log.id || `log-${Date.now()}`,
          type: log.resource?.toLowerCase() || 'unknown',
          title: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource}`,
          description: log.details?.after?.title || log.details?.after?.name || `${action} ${resource}`,
          timestamp: log.timestamp || new Date().toISOString(),
          status: log.status === 'success' ? 'completed' : 'failed',
        };
      });

      return {
        success: true,
        data: activities,
      };
    } catch (error: any) {
      // If audit endpoint is not accessible (403, 401, etc.), return empty array silently
      // Don't log expected permission errors
      if (error?.response?.status === 403 || error?.response?.status === 401) {
        return {
          success: true,
          data: [],
        };
      }
      // For other errors, still return empty array but could log in development
      if (import.meta.env.DEV) {
        console.warn('Failed to fetch recent activity:', error?.message);
      }
      return {
        success: true,
        data: [],
      };
    }
  },

  getCriticalAlerts: async (role: string): Promise<ApiResponse<CriticalAlert[]>> => {
    try {
      // Fetch role-specific critical alerts
      // This will be enhanced when backend supports it
      const alerts: CriticalAlert[] = [];

      // For now, fetch payments and disputes to generate alerts
      if (role === 'Buyer') {
        try {
          // Fetch pending approvals
          const pendingResponse = await api.get('/payments?status=pending_approval');
          const pendingPayments = pendingResponse.data?.data || [];
          
          if (Array.isArray(pendingPayments)) {
            const pendingCount = pendingPayments.length;
            const oldPending = pendingPayments.filter((p: any) => {
              const createdAt = new Date(p.createdAt || p.created_at);
              const daysOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
              return daysOld > 7;
            });

            if (pendingCount > 0) {
              alerts.push({
                id: 'buyer-pending-approvals',
                priority: oldPending.length > 0 ? AlertPriority.CRITICAL : AlertPriority.HIGH,
                title: 'Payments Awaiting Approval',
                message: `payment${pendingCount > 1 ? 's' : ''} require${pendingCount === 1 ? 's' : ''} your approval`,
                count: pendingCount,
                actionUrl: '/payments?status=pending_approval',
                actionLabel: 'مراجعة المدفوعات',
              });
            }

            // Check for overdue payments
            const allPaymentsResponse = await api.get('/payments');
            const allPayments = allPaymentsResponse.data?.data || [];
            const overduePayments = allPayments.filter((p: any) => {
              if (p.status === 'completed' || p.status === 'cancelled') return false;
              const dueDate = new Date(p.dueDate || p.due_date);
              return dueDate < new Date();
            });

            if (overduePayments.length > 0) {
              const totalOverdue = overduePayments.reduce((sum: number, p: any) => sum + (p.totalAmount || p.total_amount || 0), 0);
              alerts.push({
                id: 'buyer-overdue-payments',
                priority: AlertPriority.CRITICAL,
                title: 'Overdue Payments',
                message: `${overduePayments.length} payment${overduePayments.length > 1 ? 's' : ''} overdue`,
                count: overduePayments.length,
                amount: totalOverdue,
                currency: overduePayments[0]?.currency || 'USD',
                actionUrl: '/payments?status=overdue',
                actionLabel: 'View Overdue',
              });
            }
          }
        } catch (error) {
          // Silently fail - alerts are optional
        }
      }

      if (role === 'Supplier') {
        try {
          const paymentsResponse = await api.get('/payments');
          const payments = paymentsResponse.data?.data || [];
          const pendingPayments = payments.filter((p: any) => 
            p.status === 'pending_approval' || p.status === 'approved'
          );

          if (pendingPayments.length > 0) {
            const oldPending = pendingPayments.filter((p: any) => {
              const createdAt = new Date(p.createdAt || p.created_at);
              const daysOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
              return daysOld > 30;
            });

            if (oldPending.length > 0) {
              const totalPending = oldPending.reduce((sum: number, p: any) => sum + (p.totalAmount || p.total_amount || 0), 0);
              alerts.push({
                id: 'supplier-pending-payments',
                priority: AlertPriority.CRITICAL,
                title: 'Payments Pending Over 30 Days',
                message: `${oldPending.length} payment${oldPending.length > 1 ? 's' : ''} pending`,
                count: oldPending.length,
                amount: totalPending,
                currency: oldPending[0]?.currency || 'USD',
                actionUrl: '/payments',
                actionLabel: 'View Payments',
              });
            }
          }
        } catch (error) {
          // Silently fail
        }
      }

      if (role === 'Logistics') {
        try {
          const shipmentsResponse = await api.get('/shipments');
          const shipments = shipmentsResponse.data?.data || [];
          const delayedShipments = shipments.filter((s: any) => {
            if (s.status === 'delivered' || s.status === 'cancelled') return false;
            const expectedDate = new Date(s.expectedDeliveryDate || s.expected_delivery_date);
            return expectedDate < new Date();
          });

          if (delayedShipments.length > 0) {
            alerts.push({
              id: 'logistics-delayed-shipments',
              priority: AlertPriority.CRITICAL,
              title: 'Delayed Shipments',
              message: `${delayedShipments.length} shipment${delayedShipments.length > 1 ? 's' : ''} delayed`,
              count: delayedShipments.length,
              actionUrl: '/shipments?status=delayed',
              actionLabel: 'View Delayed',
            });
          }
        } catch (error) {
          // Silently fail
        }
      }

      if (role === 'Government') {
        try {
          const disputesResponse = await api.get('/disputes/escalated');
          const disputes = disputesResponse.data?.data || [];
          const oldDisputes = disputes.filter((d: any) => {
            const escalatedAt = new Date(d.escalatedAt || d.escalated_at || d.createdAt || d.created_at);
            const hoursOld = (Date.now() - escalatedAt.getTime()) / (1000 * 60 * 60);
            return hoursOld > 48;
          });

          if (oldDisputes.length > 0) {
            alerts.push({
              id: 'gov-escalated-disputes',
              priority: AlertPriority.CRITICAL,
              title: 'Escalated Disputes Requiring Attention',
              message: `${oldDisputes.length} dispute${oldDisputes.length > 1 ? 's' : ''} escalated over 48 hours ago`,
              count: oldDisputes.length,
              actionUrl: '/disputes/escalated',
              actionLabel: 'Review Disputes',
            });
          } else if (disputes.length > 0) {
            alerts.push({
              id: 'gov-new-disputes',
              priority: AlertPriority.HIGH,
              title: 'New Escalated Disputes',
              message: `${disputes.length} dispute${disputes.length > 1 ? 's' : ''} escalated`,
              count: disputes.length,
              actionUrl: '/disputes/escalated',
              actionLabel: 'Review Disputes',
            });
          }
        } catch (error) {
          // Silently fail
        }
      }

      return {
        success: true,
        data: alerts,
      };
    } catch (error: any) {
      // Return empty array on error
      return {
        success: true,
        data: [],
      };
    }
  },
};
