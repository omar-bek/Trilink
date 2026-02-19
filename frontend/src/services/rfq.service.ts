import api from './api';
import { ApiResponse, PaginatedResponse } from '@/types';
import { RFQ, RFQFilters } from '@/types/rfq';

import { PaginationParams } from '@/utils/pagination';

export const rfqService = {
  getRFQs: async (
    filters?: RFQFilters,
    pagination?: PaginationParams
  ): Promise<ApiResponse<RFQ[] | PaginatedResponse<RFQ>>> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.targetRole) params.append('targetRole', filters.targetRole);
    if (filters?.search) params.append('search', filters.search);
    
    // Add pagination params if provided
    if (pagination?.page) params.append('page', pagination.page.toString());
    if (pagination?.limit) params.append('limit', pagination.limit.toString());
    if (pagination?.sortBy) params.append('sortBy', pagination.sortBy);
    if (pagination?.sortOrder) params.append('sortOrder', pagination.sortOrder);

    const response = await api.get<ApiResponse<RFQ[] | PaginatedResponse<RFQ>>>(
      `/rfqs?${params.toString()}`
    );
    return response.data;
  },

  getAvailableRFQs: async (
    filters?: RFQFilters,
    pagination?: PaginationParams
  ): Promise<ApiResponse<RFQ[] | PaginatedResponse<RFQ>>> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.targetRole) params.append('targetRole', filters.targetRole);
    if (filters?.search) params.append('search', filters.search);
    
    // Add pagination params if provided
    if (pagination?.page) params.append('page', pagination.page.toString());
    if (pagination?.limit) params.append('limit', pagination.limit.toString());
    if (pagination?.sortBy) params.append('sortBy', pagination.sortBy);
    if (pagination?.sortOrder) params.append('sortOrder', pagination.sortOrder);

    const response = await api.get<ApiResponse<RFQ[] | PaginatedResponse<RFQ>>>(
      `/rfqs/available?${params.toString()}`
    );
    return response.data;
  },

  getRFQById: async (id: string): Promise<ApiResponse<RFQ>> => {
    const response = await api.get<ApiResponse<RFQ>>(`/rfqs/${id}`);
    return response.data;
  },

  getRFQsByPurchaseRequest: async (purchaseRequestId: string): Promise<ApiResponse<RFQ[]>> => {
    const response = await api.get<ApiResponse<RFQ[]>>(
      `/rfqs/purchase-request/${purchaseRequestId}`
    );
    return response.data;
  },

  createRFQ: async (data: any): Promise<ApiResponse<RFQ>> => {
    const response = await api.post<ApiResponse<RFQ>>('/rfqs', data);
    return response.data;
  },

  updateRFQ: async (id: string, data: any): Promise<ApiResponse<RFQ>> => {
    const response = await api.patch<ApiResponse<RFQ>>(`/rfqs/${id}`, data);
    return response.data;
  },

  deleteRFQ: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/rfqs/${id}`);
    return response.data;
  },

  compareBids: async (rfqId: string): Promise<ApiResponse<any>> => {
    const response = await api.get<ApiResponse<any>>(`/rfqs/${rfqId}/bids/compare`);
    return response.data;
  },

  enableAnonymity: async (id: string): Promise<ApiResponse<RFQ>> => {
    const response = await api.post<ApiResponse<RFQ>>(`/rfqs/${id}/enable-anonymity`);
    return response.data;
  },

  revealIdentity: async (id: string): Promise<ApiResponse<RFQ>> => {
    const response = await api.post<ApiResponse<RFQ>>(`/rfqs/${id}/reveal-identity`);
    return response.data;
  },
};
