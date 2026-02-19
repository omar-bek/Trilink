import api from './api';
import { ApiResponse } from '@/types';

export interface AuditLog {
    _id?: string;
    id?: string;
    userId: {
        _id: string;
        email: string;
        role?: string;
    };
    companyId?: {
        _id: string;
        name: string;
    };
    action: string;
    resource: string;
    resourceId?: string;
    details: {
        before?: Record<string, unknown>;
        after?: Record<string, unknown>;
        changes?: Record<string, unknown>;
        method?: string;
        path?: string;
        statusCode?: number;
        duration?: number;
    };
    ipAddress?: string;
    userAgent?: string;
    status: 'success' | 'failure';
    errorMessage?: string;
    timestamp: string;
}

export interface AuditLogFilters {
    userId?: string;
    companyId?: string;
    action?: string;
    resource?: string;
    resourceId?: string;
    status?: 'success' | 'failure';
    startDate?: string;
    endDate?: string;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export const auditService = {
    getAuditLogs: async (
        filters?: AuditLogFilters,
        pagination?: PaginationParams
    ): Promise<ApiResponse<{ logs: AuditLog[]; pagination: any }>> => {
        const params = new URLSearchParams();

        if (filters?.userId) params.append('userId', filters.userId);
        if (filters?.companyId) params.append('companyId', filters.companyId);
        if (filters?.action) params.append('action', filters.action);
        if (filters?.resource) params.append('resource', filters.resource);
        if (filters?.resourceId) params.append('resourceId', filters.resourceId);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);

        if (pagination?.page) params.append('skip', ((pagination.page - 1) * (pagination.limit || 50)).toString());
        if (pagination?.limit) params.append('limit', pagination.limit.toString());
        if (pagination?.sortBy) params.append('sortBy', pagination.sortBy);
        if (pagination?.sortOrder) params.append('sortOrder', pagination.sortOrder);

        const response = await api.get<ApiResponse<{ logs: AuditLog[]; pagination: any }>>(
            `/audit?${params.toString()}`
        );
        return response.data;
    },

    getAuditLogsByResource: async (
        resource: string,
        resourceId: string,
        filters?: Omit<AuditLogFilters, 'resource' | 'resourceId'>
    ): Promise<ApiResponse<{ logs: AuditLog[]; pagination: any }>> => {
        const params = new URLSearchParams();

        if (filters?.userId) params.append('userId', filters.userId);
        if (filters?.companyId) params.append('companyId', filters.companyId);
        if (filters?.action) params.append('action', filters.action);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);

        const response = await api.get<ApiResponse<{ logs: AuditLog[]; pagination: any }>>(
            `/audit/resource/${resource}/${resourceId}?${params.toString()}`
        );
        return response.data;
    },

    exportAuditLogs: async (
        filters?: AuditLogFilters,
        format: 'pdf' | 'csv' | 'xlsx' = 'csv'
    ): Promise<Blob> => {
        const params = new URLSearchParams();

        if (filters?.userId) params.append('userId', filters.userId);
        if (filters?.companyId) params.append('companyId', filters.companyId);
        if (filters?.action) params.append('action', filters.action);
        if (filters?.resource) params.append('resource', filters.resource);
        if (filters?.resourceId) params.append('resourceId', filters.resourceId);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);
        params.append('format', format === 'xlsx' ? 'excel' : format);

        const response = await api.get(`/audit/export?${params.toString()}`, {
            responseType: 'blob',
        });
        return response.data;
    },
};
