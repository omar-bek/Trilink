import api from './api';
import { ApiResponse, PaginatedResponse } from '@/types';
import {
  PurchaseRequest,
  CreatePurchaseRequestDto,
  UpdatePurchaseRequestDto,
  PurchaseRequestFilters,
} from '@/types/purchase-request';
import { PaginationParams } from '@/utils/pagination';

export const purchaseRequestService = {
  getPurchaseRequests: async (
    filters?: PurchaseRequestFilters,
    pagination?: PaginationParams
  ): Promise<ApiResponse<PurchaseRequest[] | PaginatedResponse<PurchaseRequest>>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.buyerId) params.append('buyerId', filters.buyerId);
    
    if (pagination?.page) params.append('page', pagination.page.toString());
    if (pagination?.limit) params.append('limit', pagination.limit.toString());
    if (pagination?.sortBy) params.append('sortBy', pagination.sortBy);
    if (pagination?.sortOrder) params.append('sortOrder', pagination.sortOrder);

    const response = await api.get<ApiResponse<PurchaseRequest[] | PaginatedResponse<PurchaseRequest>>>(
      `/purchase-requests?${params.toString()}`
    );
    return response.data;
  },

  getPurchaseRequestById: async (id: string): Promise<ApiResponse<PurchaseRequest>> => {
    const response = await api.get<ApiResponse<PurchaseRequest>>(`/purchase-requests/${id}`);
    return response.data;
  },

  createPurchaseRequest: async (
    data: CreatePurchaseRequestDto
  ): Promise<ApiResponse<PurchaseRequest>> => {
    const response = await api.post<ApiResponse<PurchaseRequest>>('/purchase-requests', data);
    return response.data;
  },

  updatePurchaseRequest: async (
    id: string,
    data: UpdatePurchaseRequestDto
  ): Promise<ApiResponse<PurchaseRequest>> => {
    const response = await api.patch<ApiResponse<PurchaseRequest>>(
      `/purchase-requests/${id}`,
      data
    );
    return response.data;
  },

  submitPurchaseRequest: async (id: string): Promise<ApiResponse<PurchaseRequest>> => {
    const response = await api.post<ApiResponse<PurchaseRequest>>(
      `/purchase-requests/${id}/submit`
    );
    return response.data;
  },

  deletePurchaseRequest: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/purchase-requests/${id}`);
    return response.data;
  },

  approvePurchaseRequest: async (
    id: string,
    data?: { notes?: string }
  ): Promise<ApiResponse<PurchaseRequest>> => {
    const response = await api.post<ApiResponse<PurchaseRequest>>(
      `/purchase-requests/${id}/approve`,
      data || {}
    );
    return response.data;
  },
};
