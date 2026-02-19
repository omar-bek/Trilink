import React from 'react';
import { Role } from '@/types';
import {
    ShoppingCart,
    Assignment,
    Gavel,
    AccountBalance,
    LocalShipping,
    Payment,
    People,
    Business,
    TrendingUp,
    Warning,
    ErrorOutline,
    CheckCircle,
    AccessTime,
} from '@mui/icons-material';
import { ReactNode } from 'react';

export interface KPIConfig {
    title: string;
    valueKey: string;
    unit: string;
    icon: ReactNode;
    color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
    path: string;
    subtitleKey?: string; // For additional context
    trendKey?: string; // Key for trend data
}

export const roleKPIConfigs: Record<Role, KPIConfig[]> = {
    [Role.BUYER]: [
        {
            title: 'Payments Awaiting Approval',
            valueKey: 'pendingApprovals',
            unit: 'payments',
            icon: React.createElement(ErrorOutline),
            color: 'error',
            path: '/payments?status=pending_approval',
        },
        {
            title: 'Active Purchase Requests',
            valueKey: 'activePurchaseRequests',
            unit: 'requests',
            icon: React.createElement(ShoppingCart),
            color: 'primary',
            path: '/purchase-requests',
        },
        {
            title: 'RFQs Pending Response',
            valueKey: 'rfqsPendingResponse',
            unit: 'RFQs',
            icon: React.createElement(Assignment),
            color: 'warning',
            path: '/rfqs?status=open',
        },
        {
            title: 'Total Contract Value',
            valueKey: 'totalContractValue',
            unit: 'USD',
            icon: React.createElement(AccountBalance),
            color: 'success',
            path: '/contracts',
            trendKey: 'contractValueTrend',
        },
        {
            title: 'Overdue Payments',
            valueKey: 'overduePaymentsCount',
            unit: 'payments',
            icon: React.createElement(Warning),
            color: 'error',
            path: '/payments?status=overdue',
            subtitleKey: 'overduePaymentsAmount',
        },
    ],

    [Role.SUPPLIER]: [
        {
            title: 'Available RFQs',
            valueKey: 'availableRFQs',
            unit: 'RFQs',
            icon: React.createElement(Assignment),
            color: 'primary',
            path: '/rfqs',
        },
        {
            title: 'Bids Awaiting Response',
            valueKey: 'pendingBids',
            unit: 'bids',
            icon: React.createElement(Warning),
            color: 'warning',
            path: '/bids?status=pending',
        },
        {
            title: 'Active Contracts',
            valueKey: 'activeContracts',
            unit: 'contracts',
            icon: React.createElement(CheckCircle),
            color: 'success',
            path: '/contracts',
        },
        {
            title: 'Revenue This Month',
            valueKey: 'monthlyRevenue',
            unit: 'USD',
            icon: React.createElement(Payment),
            color: 'success',
            path: '/payments',
            trendKey: 'revenueTrend',
        },
        {
            title: 'Payments Pending',
            valueKey: 'pendingPaymentsCount',
            unit: 'payments',
            icon: React.createElement(Warning),
            color: 'warning',
            path: '/payments?status=pending',
            subtitleKey: 'pendingPaymentsAmount',
        },
    ],

    [Role.LOGISTICS]: [
        {
            title: 'Active Shipments',
            valueKey: 'activeShipments',
            unit: 'shipments',
            icon: React.createElement(LocalShipping),
            color: 'primary',
            path: '/shipments',
        },
        {
            title: 'Delayed Shipments',
            valueKey: 'delayedShipments',
            unit: 'shipments',
            icon: React.createElement(ErrorOutline),
            color: 'error',
            path: '/shipments?status=delayed',
        },
        {
            title: 'On-Time Delivery',
            valueKey: 'onTimeDeliveryRate',
            unit: '%',
            icon: React.createElement(CheckCircle),
            color: 'success',
            path: '/shipments',
            trendKey: 'deliveryTrend',
        },
        {
            title: 'Shipments Today',
            valueKey: 'shipmentsToday',
            unit: 'shipments',
            icon: React.createElement(LocalShipping),
            color: 'info',
            path: '/shipments',
        },
    ],

    [Role.GOVERNMENT]: [
        {
            title: 'Escalated Disputes',
            valueKey: 'escalatedDisputes',
            unit: 'disputes',
            icon: React.createElement(ErrorOutline),
            color: 'error',
            path: '/disputes/escalated',
        },
        {
            title: 'Compliance Violations',
            valueKey: 'complianceViolations',
            unit: 'violations',
            icon: React.createElement(Warning),
            color: 'error',
            path: '/analytics/government?filter=compliance',
        },
        {
            title: 'Total Platform Value',
            valueKey: 'totalPlatformValue',
            unit: 'USD',
            icon: React.createElement(AccountBalance),
            color: 'success',
            path: '/analytics/government',
            trendKey: 'platformValueTrend',
        },
        {
            title: 'Active Companies',
            valueKey: 'activeCompanies',
            unit: 'companies',
            icon: React.createElement(Business),
            color: 'info',
            path: '/analytics/government',
        },
        {
            title: 'Transactions This Month',
            valueKey: 'monthlyTransactions',
            unit: 'transactions',
            icon: React.createElement(Assignment),
            color: 'primary',
            path: '/analytics/government',
        },
        {
            title: 'Average Dispute Resolution Time',
            valueKey: 'avgDisputeResolutionTime',
            unit: 'days',
            icon: React.createElement(AccessTime),
            color: 'info',
            path: '/disputes',
        },
        {
            title: 'Platform Uptime',
            valueKey: 'platformUptime',
            unit: '%',
            icon: React.createElement(CheckCircle),
            color: 'success',
            path: '/analytics/government',
        },
    ],

    [Role.ADMIN]: [
        {
            title: 'System Health',
            valueKey: 'systemHealth',
            unit: 'status',
            icon: React.createElement(CheckCircle),
            color: 'success',
            path: '/admin',
        },
        {
            title: 'Total Users',
            valueKey: 'totalUsers',
            unit: 'users',
            icon: React.createElement(People),
            color: 'info',
            path: '/admin/users',
            trendKey: 'userGrowth',
        },
        {
            title: 'Active Companies',
            valueKey: 'activeCompanies',
            unit: 'companies',
            icon: React.createElement(Business),
            color: 'success',
            path: '/admin/companies',
        },
        {
            title: 'Platform Growth',
            valueKey: 'platformGrowth',
            unit: '% vs last month',
            icon: React.createElement(TrendingUp),
            color: 'success',
            path: '/analytics/government',
            trendKey: 'growthTrend',
        },
    ],

    // Default for other roles
    [Role.CLEARANCE]: [
        {
            title: 'Clearance Approvals',
            valueKey: 'clearanceApprovals',
            unit: 'approvals',
            icon: React.createElement(CheckCircle),
            color: 'success',
            path: '/shipments?status=in_clearance',
        },
        {
            title: 'Pending Clearance',
            valueKey: 'pendingClearance',
            unit: 'shipments',
            icon: React.createElement(Warning),
            color: 'warning',
            path: '/shipments?status=in_clearance',
        },
        {
            title: 'Rejection Rate',
            valueKey: 'clearanceRejectionRate',
            unit: '%',
            icon: React.createElement(ErrorOutline),
            color: 'error',
            path: '/shipments?status=in_clearance',
        },
        {
            title: 'Clearance This Month',
            valueKey: 'monthlyClearances',
            unit: 'clearances',
            icon: React.createElement(Assignment),
            color: 'primary',
            path: '/shipments',
        },
    ],

    [Role.SERVICE_PROVIDER]: [
        {
            title: 'Available RFQs',
            valueKey: 'availableRFQs',
            unit: 'RFQs',
            icon: React.createElement(Assignment),
            color: 'primary',
            path: '/rfqs',
        },
        {
            title: 'Bids Submitted',
            valueKey: 'totalBids',
            unit: 'bids',
            icon: React.createElement(Gavel),
            color: 'info',
            path: '/bids',
        },
        {
            title: 'Active Contracts',
            valueKey: 'activeContracts',
            unit: 'contracts',
            icon: React.createElement(AccountBalance),
            color: 'success',
            path: '/contracts',
        },
        {
            title: 'Revenue This Month',
            valueKey: 'monthlyRevenue',
            unit: 'USD',
            icon: React.createElement(Payment),
            color: 'success',
            path: '/payments',
            trendKey: 'revenueTrend',
        },
    ],

    [Role.COMPANY_MANAGER]: [
        {
            title: 'Payments Awaiting Approval',
            valueKey: 'pendingApprovals',
            unit: 'payments',
            icon: React.createElement(ErrorOutline),
            color: 'error',
            path: '/payments?status=pending_approval',
        },
        {
            title: 'Active Purchase Requests',
            valueKey: 'activePurchaseRequests',
            unit: 'requests',
            icon: React.createElement(ShoppingCart),
            color: 'primary',
            path: '/purchase-requests',
        },
        {
            title: 'RFQs Pending Response',
            valueKey: 'rfqsPendingResponse',
            unit: 'RFQs',
            icon: React.createElement(Assignment),
            color: 'warning',
            path: '/rfqs?status=open',
        },
        {
            title: 'Total Contract Value',
            valueKey: 'totalContractValue',
            unit: 'USD',
            icon: React.createElement(AccountBalance),
            color: 'success',
            path: '/contracts',
            trendKey: 'contractValueTrend',
        },
        {
            title: 'Overdue Payments',
            valueKey: 'overduePaymentsCount',
            unit: 'payments',
            icon: React.createElement(Warning),
            color: 'error',
            path: '/payments?status=overdue',
            subtitleKey: 'overduePaymentsAmount',
        },
    ],
};

export const rolePrimaryActions: Record<Role, { label: string; path: string }> = {
    [Role.BUYER]: {
        label: 'Create Purchase Request',
        path: '/purchase-requests/new',
    },
    [Role.SUPPLIER]: {
        label: 'Browse Available RFQs',
        path: '/rfqs',
    },
    [Role.LOGISTICS]: {
        label: 'Create Shipment',
        path: '/shipments/new',
    },
    [Role.GOVERNMENT]: {
        label: 'Review Escalated Disputes',
        path: '/disputes/escalated',
    },
    [Role.ADMIN]: {
        label: 'System Settings',
        path: '/admin',
    },
    [Role.CLEARANCE]: {
        label: 'View Available RFQs',
        path: '/rfqs',
    },
    [Role.SERVICE_PROVIDER]: {
        label: 'View Available RFQs',
        path: '/rfqs',
    },
    [Role.COMPANY_MANAGER]: {
        label: 'Manage Company Settings',
        path: '/profile/company',
    },
};
