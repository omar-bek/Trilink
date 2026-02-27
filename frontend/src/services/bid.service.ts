import api from './api';
import { ApiResponse, PaginatedResponse } from '@/types';
import { Bid, CreateBidDto, UpdateBidDto, EvaluateBidDto, BidFilters } from '@/types/bid';

// Import PaginationParams type
import type { PaginationParams } from '@/utils/pagination';

export const bidService = {
  getBids: async (
    filters?: BidFilters,
    pagination?: PaginationParams
  ): Promise<ApiResponse<Bid[] | PaginatedResponse<Bid>>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.rfqId) params.append('rfqId', filters.rfqId);
    
    if (pagination?.page) params.append('page', pagination.page.toString());
    if (pagination?.limit) params.append('limit', pagination.limit.toString());
    if (pagination?.sortBy) params.append('sortBy', pagination.sortBy);
    if (pagination?.sortOrder) params.append('sortOrder', pagination.sortOrder);

    const response = await api.get<ApiResponse<Bid[] | PaginatedResponse<Bid>>>(
      `/bids?${params.toString()}`
    );
    return response.data;
  },

  getBidsByRFQ: async (rfqId: string, filters?: { status?: string }): Promise<ApiResponse<Bid[]>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);

    const response = await api.get<ApiResponse<Bid[]>>(`/bids/rfq/${rfqId}?${params.toString()}`);
    return response.data;
  },

  getBidById: async (id: string): Promise<ApiResponse<Bid>> => {
    const response = await api.get<ApiResponse<Bid>>(`/bids/${id}`);
    return response.data;
  },

  createBid: async (data: CreateBidDto): Promise<ApiResponse<Bid>> => {
    const response = await api.post<ApiResponse<Bid>>('/bids', data);
    return response.data;
  },

  updateBid: async (id: string, data: UpdateBidDto): Promise<ApiResponse<Bid>> => {
    const response = await api.patch<ApiResponse<Bid>>(`/bids/${id}`, data);
    return response.data;
  },

  withdrawBid: async (id: string): Promise<ApiResponse<Bid>> => {
    const response = await api.post<ApiResponse<Bid>>(`/bids/${id}/withdraw`);
    return response.data;
  },

  evaluateBid: async (id: string, data: EvaluateBidDto): Promise<ApiResponse<Bid>> => {
    const response = await api.post<ApiResponse<Bid>>(`/bids/${id}/evaluate`, data);
    return response.data;
  },

  deleteBid: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/bids/${id}`);
    return response.data;
  },

  enableAnonymity: async (id: string): Promise<ApiResponse<Bid>> => {
    const response = await api.post<ApiResponse<Bid>>(`/bids/${id}/enable-anonymity`);
    return response.data;
  },

  revealIdentity: async (id: string): Promise<ApiResponse<Bid>> => {
    const response = await api.post<ApiResponse<Bid>>(`/bids/${id}/reveal-identity`);
    return response.data;
  },
};
