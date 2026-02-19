import api from './api';
import { ApiResponse, PaginatedResponse } from '@/types';
import { Shipment, ShipmentFilters, SubmitCustomsDocumentsDto, UpdateCustomsClearanceStatusDto, ResubmitCustomsDocumentsDto } from '@/types/shipment';
import { PaginationParams } from '@/utils/pagination';

export const shipmentService = {
  getShipments: async (
    filters?: ShipmentFilters,
    pagination?: PaginationParams
  ): Promise<ApiResponse<Shipment[] | PaginatedResponse<Shipment>>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);

    if (pagination?.page) params.append('page', pagination.page.toString());
    if (pagination?.limit) params.append('limit', pagination.limit.toString());
    if (pagination?.sortBy) params.append('sortBy', pagination.sortBy);
    if (pagination?.sortOrder) params.append('sortOrder', pagination.sortOrder);

    const response = await api.get<ApiResponse<Shipment[] | PaginatedResponse<Shipment>>>(
      `/shipments?${params.toString()}`
    );
    return response.data;
  },

  getShipmentById: async (id: string): Promise<ApiResponse<Shipment>> => {
    const response = await api.get<ApiResponse<Shipment>>(`/shipments/${id}`);
    return response.data;
  },

  createShipment: async (data: any): Promise<ApiResponse<Shipment>> => {
    const response = await api.post<ApiResponse<Shipment>>('/shipments', data);
    return response.data;
  },

  updateStatus: async (id: string, data: any): Promise<ApiResponse<Shipment>> => {
    const response = await api.patch<ApiResponse<Shipment>>(`/shipments/${id}/status`, data);
    return response.data;
  },

  updateLocation: async (id: string, data: any): Promise<ApiResponse<Shipment>> => {
    const response = await api.patch<ApiResponse<Shipment>>(`/shipments/${id}/location`, data);
    return response.data;
  },

  inspect: async (id: string, data: any): Promise<ApiResponse<Shipment>> => {
    const response = await api.post<ApiResponse<Shipment>>(`/shipments/${id}/inspect`, data);
    return response.data;
  },

  deleteShipment: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/shipments/${id}`);
    return response.data;
  },

  getShipmentsByContract: async (contractId: string): Promise<ApiResponse<Shipment[]>> => {
    const params = new URLSearchParams();
    params.append('contractId', contractId);
    const response = await api.get<ApiResponse<Shipment[]>>(`/shipments?${params.toString()}`);
    return response.data;
  },

  submitCustomsDocuments: async (id: string, data: SubmitCustomsDocumentsDto): Promise<ApiResponse<Shipment>> => {
    const response = await api.post<ApiResponse<Shipment>>(`/shipments/${id}/customs/documents`, data);
    return response.data;
  },

  updateCustomsClearanceStatus: async (id: string, data: UpdateCustomsClearanceStatusDto): Promise<ApiResponse<Shipment>> => {
    const response = await api.patch<ApiResponse<Shipment>>(`/shipments/${id}/customs/status`, data);
    return response.data;
  },

  resubmitCustomsDocuments: async (id: string, data: ResubmitCustomsDocumentsDto): Promise<ApiResponse<Shipment>> => {
    const response = await api.post<ApiResponse<Shipment>>(`/shipments/${id}/customs/resubmit`, data);
    return response.data;
  },
};
