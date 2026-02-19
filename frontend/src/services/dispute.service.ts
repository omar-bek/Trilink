import api from './api';
import { ApiResponse, PaginatedResponse } from '@/types';
import {
  Dispute,
  CreateDisputeDto,
  UpdateDisputeDto,
  EscalateDisputeDto,
  ResolveDisputeDto,
  AddAttachmentDto,
  AssignDisputeDto,
  DisputeFilters,
} from '@/types/dispute';
import { PaginationParams } from '@/utils/pagination';

export const disputeService = {
  getDisputes: async (
    filters?: DisputeFilters,
    pagination?: PaginationParams
  ): Promise<ApiResponse<Dispute[] | PaginatedResponse<Dispute>>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.escalated !== undefined) params.append('escalated', String(filters.escalated));
    
    if (pagination?.page) params.append('page', pagination.page.toString());
    if (pagination?.limit) params.append('limit', pagination.limit.toString());
    if (pagination?.sortBy) params.append('sortBy', pagination.sortBy);
    if (pagination?.sortOrder) params.append('sortOrder', pagination.sortOrder);

    const response = await api.get<ApiResponse<Dispute[] | PaginatedResponse<Dispute>>>(
      `/disputes?${params.toString()}`
    );
    return response.data;
  },

  getEscalatedDisputes: async (): Promise<ApiResponse<Dispute[]>> => {
    const response = await api.get<ApiResponse<Dispute[]>>('/disputes/escalated');
    return response.data;
  },

  getDisputeById: async (id: string): Promise<ApiResponse<Dispute>> => {
    const response = await api.get<ApiResponse<Dispute>>(`/disputes/${id}`);
    return response.data;
  },

  createDispute: async (data: CreateDisputeDto): Promise<ApiResponse<Dispute>> => {
    const response = await api.post<ApiResponse<Dispute>>('/disputes', data);
    return response.data;
  },

  escalateDispute: async (id: string, data: EscalateDisputeDto): Promise<ApiResponse<Dispute>> => {
    const response = await api.post<ApiResponse<Dispute>>(`/disputes/${id}/escalate`, data);
    return response.data;
  },

  resolveDispute: async (id: string, data: ResolveDisputeDto): Promise<ApiResponse<Dispute>> => {
    const response = await api.post<ApiResponse<Dispute>>(`/disputes/${id}/resolve`, data);
    return response.data;
  },

  addAttachments: async (id: string, data: AddAttachmentDto): Promise<ApiResponse<Dispute>> => {
    const response = await api.post<ApiResponse<Dispute>>(`/disputes/${id}/attachments`, data);
    return response.data;
  },

  getDisputesAssignedToMe: async (filters?: { status?: string }): Promise<ApiResponse<Dispute[]>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);

    const response = await api.get<ApiResponse<Dispute[]>>(
      `/disputes/assigned-to-me?${params.toString()}`
    );
    return response.data;
  },

  updateDispute: async (id: string, data: UpdateDisputeDto): Promise<ApiResponse<Dispute>> => {
    const response = await api.patch<ApiResponse<Dispute>>(`/disputes/${id}`, data);
    return response.data;
  },

  assignDispute: async (id: string, data: AssignDisputeDto): Promise<ApiResponse<Dispute>> => {
    const response = await api.post<ApiResponse<Dispute>>(`/disputes/${id}/assign`, data);
    return response.data;
  },

  deleteDispute: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/disputes/${id}`);
    return response.data;
  },
};
