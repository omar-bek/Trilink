import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shipmentService } from '@/services/shipment.service';
import {
  ShipmentFilters,
  CreateShipmentDto,
  UpdateShipmentStatusDto,
  UpdateGPSLocationDto,
  InspectShipmentDto,
  SubmitCustomsDocumentsDto,
  UpdateCustomsClearanceStatusDto,
  ResubmitCustomsDocumentsDto,
} from '@/types/shipment';
import { PaginationParams } from '@/utils/pagination';
import { queryKeys, invalidateListQueries, invalidateDetailQuery } from '@/lib/queryKeys';
import { notificationService } from '@/utils/notification';

export const useShipments = (filters?: ShipmentFilters, pagination?: PaginationParams) => {
  return useQuery({
    queryKey: queryKeys.shipments.list(filters, pagination),
    queryFn: () => shipmentService.getShipments(filters, pagination),
    staleTime: 1 * 60 * 1000, // 1 minute (shorter for real-time updates)
    refetchInterval: 30 * 1000, // Refetch every 30 seconds as fallback
  });
};

export const useShipment = (id: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.shipments.detail(id!),
    queryFn: () => shipmentService.getShipmentById(id!),
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
    refetchInterval: 30 * 1000,
  });
};

export const useCreateShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateShipmentDto) => shipmentService.createShipment(data),
    onSuccess: () => {
      invalidateListQueries(queryClient, 'shipments');
      notificationService.showSuccess('Shipment created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create shipment';
      notificationService.showError(message);
    },
  });
};

export const useUpdateShipmentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateShipmentStatusDto }) =>
      shipmentService.updateStatus(id, data),
    onSuccess: (_, variables) => {
      invalidateListQueries(queryClient, 'shipments');
      invalidateDetailQuery(queryClient, 'shipments', variables.id);
      notificationService.showSuccess('Shipment status updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update shipment status';
      notificationService.showError(message);
    },
  });
};

export const useUpdateGPSLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGPSLocationDto }) =>
      shipmentService.updateLocation(id, data),
    onSuccess: (_, variables) => {
      invalidateDetailQuery(queryClient, 'shipments', variables.id);
      notificationService.showSuccess('GPS location updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update GPS location';
      notificationService.showError(message);
    },
  });
};

export const useInspectShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: InspectShipmentDto }) =>
      shipmentService.inspect(id, data),
    onSuccess: (_, variables) => {
      invalidateListQueries(queryClient, 'shipments');
      invalidateDetailQuery(queryClient, 'shipments', variables.id);
      notificationService.showSuccess('Shipment inspection completed');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to inspect shipment';
      notificationService.showError(message);
    },
  });
};

export const useDeleteShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => shipmentService.deleteShipment(id),
    onSuccess: () => {
      invalidateListQueries(queryClient, 'shipments');
      notificationService.showSuccess('Shipment deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete shipment';
      notificationService.showError(message);
    },
  });
};

export const useShipmentsByContract = (contractId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.shipments.list({ contractId }, undefined),
    queryFn: () => shipmentService.getShipmentsByContract(contractId!),
    enabled: !!contractId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds as fallback
  });
};

export const useSubmitCustomsDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubmitCustomsDocumentsDto }) =>
      shipmentService.submitCustomsDocuments(id, data),
    onSuccess: (_, variables) => {
      invalidateDetailQuery(queryClient, 'shipments', variables.id);
      invalidateListQueries(queryClient, 'shipments');
      notificationService.showSuccess('Customs documents submitted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.response?.data?.message || 'Failed to submit customs documents';
      notificationService.showError(message);
    },
  });
};

export const useUpdateCustomsClearanceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomsClearanceStatusDto }) =>
      shipmentService.updateCustomsClearanceStatus(id, data),
    onSuccess: (_, variables) => {
      invalidateDetailQuery(queryClient, 'shipments', variables.id);
      invalidateListQueries(queryClient, 'shipments');
      notificationService.showSuccess('Customs clearance status updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.response?.data?.message || 'Failed to update customs clearance status';
      notificationService.showError(message);
    },
  });
};

export const useResubmitCustomsDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResubmitCustomsDocumentsDto }) =>
      shipmentService.resubmitCustomsDocuments(id, data),
    onSuccess: (_, variables) => {
      invalidateDetailQuery(queryClient, 'shipments', variables.id);
      invalidateListQueries(queryClient, 'shipments');
      notificationService.showSuccess('Customs documents resubmitted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.response?.data?.message || 'Failed to resubmit customs documents';
      notificationService.showError(message);
    },
  });
};