import api from './api';
import { ApiResponse, PaginatedResponse } from '@/types';
import {
  Contract,
  SignContractDto,
  ContractFilters,
  CreateContractDto,
  UpdateContractDto,
  CreateAmendmentDto,
  ApproveAmendmentDto,
  Amendment,
  ContractVersion,
  VersionDiff,
} from '@/types/contract';
import { PaginationParams } from '@/utils/pagination';

export const contractService = {
  getContracts: async (
    filters?: ContractFilters,
    pagination?: PaginationParams
  ): Promise<ApiResponse<Contract[] | PaginatedResponse<Contract>>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.minAmount) params.append('minAmount', filters.minAmount.toString());
    if (filters?.maxAmount) params.append('maxAmount', filters.maxAmount.toString());
    
    if (pagination?.page) params.append('page', pagination.page.toString());
    if (pagination?.limit) params.append('limit', pagination.limit.toString());
    if (pagination?.sortBy) params.append('sortBy', pagination.sortBy);
    if (pagination?.sortOrder) params.append('sortOrder', pagination.sortOrder);

    const response = await api.get<ApiResponse<Contract[] | PaginatedResponse<Contract>>>(
      `/contracts?${params.toString()}`
    );
    return response.data;
  },

  getContractById: async (id: string): Promise<ApiResponse<Contract>> => {
    const response = await api.get<ApiResponse<Contract>>(`/contracts/${id}`);
    return response.data;
  },

  createContract: async (data: CreateContractDto): Promise<ApiResponse<Contract>> => {
    const response = await api.post<ApiResponse<Contract>>('/contracts', data);
    return response.data;
  },

  updateContract: async (
    id: string,
    data: UpdateContractDto
  ): Promise<ApiResponse<Contract>> => {
    const response = await api.patch<ApiResponse<Contract>>(`/contracts/${id}`, data);
    return response.data;
  },

  deleteContract: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/contracts/${id}`);
    return response.data;
  },

  signContract: async (id: string, data: SignContractDto): Promise<ApiResponse<Contract>> => {
    const response = await api.post<ApiResponse<Contract>>(`/contracts/${id}/sign`, data);
    return response.data;
  },

  activateContract: async (id: string): Promise<ApiResponse<Contract>> => {
    const response = await api.post<ApiResponse<Contract>>(`/contracts/${id}/activate`);
    return response.data;
  },

  getContractPdf: async (id: string): Promise<Blob> => {
    const response = await api.get(`/contracts/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Amendment methods
  createAmendment: async (
    contractId: string,
    data: CreateAmendmentDto
  ): Promise<ApiResponse<Amendment>> => {
    const response = await api.post<ApiResponse<Amendment>>(
      `/contracts/${contractId}/amendments`,
      data
    );
    return response.data;
  },

  getContractAmendments: async (
    contractId: string,
    filters?: { status?: string }
  ): Promise<ApiResponse<Amendment[]>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);

    const response = await api.get<ApiResponse<Amendment[]>>(
      `/contracts/${contractId}/amendments?${params.toString()}`
    );
    return response.data;
  },

  getAmendmentById: async (
    contractId: string,
    amendmentId: string
  ): Promise<ApiResponse<Amendment>> => {
    const response = await api.get<ApiResponse<Amendment>>(
      `/contracts/${contractId}/amendments/${amendmentId}`
    );
    return response.data;
  },

  approveAmendment: async (
    contractId: string,
    amendmentId: string,
    data: ApproveAmendmentDto
  ): Promise<ApiResponse<Amendment>> => {
    const response = await api.post<ApiResponse<Amendment>>(
      `/contracts/${contractId}/amendments/${amendmentId}/approve`,
      data
    );
    return response.data;
  },

  // Version history methods
  getVersionHistory: async (
    contractId: string
  ): Promise<ApiResponse<ContractVersion[]>> => {
    const response = await api.get<ApiResponse<ContractVersion[]>>(
      `/contracts/${contractId}/versions`
    );
    return response.data;
  },

  getContractVersion: async (
    contractId: string,
    version: number
  ): Promise<ApiResponse<ContractVersion>> => {
    const response = await api.get<ApiResponse<ContractVersion>>(
      `/contracts/${contractId}/versions/${version}`
    );
    return response.data;
  },

  compareVersions: async (
    contractId: string,
    version1: number,
    version2: number
  ): Promise<ApiResponse<VersionDiff>> => {
    const response = await api.get<ApiResponse<VersionDiff>>(
      `/contracts/${contractId}/versions/compare?version1=${version1}&version2=${version2}`
    );
    return response.data;
  },
};
