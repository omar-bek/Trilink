import api from './api';
import { ApiResponse, PaginatedResponse } from '@/types';
import { Payment, PaymentFilters, ApprovePaymentDto, RejectPaymentDto, RetryPaymentDto, UpdatePaymentMethodDto, ProcessPaymentDto } from '@/types/payment';
import { PaginationParams } from '@/utils/pagination';

export const paymentService = {
  getPayments: async (
    filters?: PaymentFilters,
    pagination?: PaginationParams
  ): Promise<ApiResponse<Payment[] | PaginatedResponse<Payment>>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.recipientCompanyId) params.append('recipientCompanyId', filters.recipientCompanyId);
    
    if (pagination?.page) params.append('page', pagination.page.toString());
    if (pagination?.limit) params.append('limit', pagination.limit.toString());
    if (pagination?.sortBy) params.append('sortBy', pagination.sortBy);
    if (pagination?.sortOrder) params.append('sortOrder', pagination.sortOrder);

    const response = await api.get<ApiResponse<Payment[] | PaginatedResponse<Payment>>>(
      `/payments?${params.toString()}`
    );
    return response.data;
  },

  getPaymentById: async (id: string): Promise<ApiResponse<Payment>> => {
    const response = await api.get<ApiResponse<Payment>>(`/payments/${id}`);
    return response.data;
  },

  getPaymentsByContract: async (contractId: string): Promise<ApiResponse<Payment[]>> => {
    const params = new URLSearchParams();
    params.append('contractId', contractId);
    const response = await api.get<ApiResponse<Payment[]>>(`/payments?${params.toString()}`);
    return response.data;
  },

  approvePayment: async (id: string, data: ApprovePaymentDto): Promise<ApiResponse<Payment>> => {
    const response = await api.post<ApiResponse<Payment>>(`/payments/${id}/approve`, data);
    return response.data;
  },

  rejectPayment: async (id: string, data: RejectPaymentDto): Promise<ApiResponse<Payment>> => {
    const response = await api.post<ApiResponse<Payment>>(`/payments/${id}/reject`, data);
    return response.data;
  },

  retryPayment: async (id: string, data: RetryPaymentDto): Promise<ApiResponse<Payment>> => {
    const response = await api.post<ApiResponse<Payment>>(`/payments/${id}/retry`, data);
    return response.data;
  },

  updatePaymentMethod: async (id: string, data: UpdatePaymentMethodDto): Promise<ApiResponse<Payment>> => {
    const response = await api.patch<ApiResponse<Payment>>(`/payments/${id}/payment-method`, data);
    return response.data;
  },

  processPayment: async (id: string, data: ProcessPaymentDto): Promise<ApiResponse<Payment>> => {
    const response = await api.post<ApiResponse<Payment>>(`/payments/${id}/process`, data);
    return response.data;
  },
};
