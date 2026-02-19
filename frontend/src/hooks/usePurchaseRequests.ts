import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseRequestService } from '@/services/purchase-request.service';
import {
  PurchaseRequest,
  CreatePurchaseRequestDto,
  UpdatePurchaseRequestDto,
  PurchaseRequestFilters,
} from '@/types/purchase-request';
import { PaginationParams } from '@/utils/pagination';
import { notificationService } from '@/utils/notification';
import { queryKeys, invalidateListQueries, invalidateDetailQuery } from '@/lib/queryKeys';

export const usePurchaseRequests = (filters?: PurchaseRequestFilters, pagination?: PaginationParams) => {
  return useQuery({
    queryKey: queryKeys.purchaseRequests.list(filters, pagination),
    queryFn: () => purchaseRequestService.getPurchaseRequests(filters, pagination),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const usePurchaseRequest = (id: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.purchaseRequests.detail(id!),
    queryFn: () => purchaseRequestService.getPurchaseRequestById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreatePurchaseRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePurchaseRequestDto) =>
      purchaseRequestService.createPurchaseRequest(data),
    onSuccess: () => {
      invalidateListQueries(queryClient, 'purchaseRequests');
      notificationService.showSuccess('Purchase request created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create purchase request';
      notificationService.showError(message);
    },
  });
};

export const useUpdatePurchaseRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePurchaseRequestDto }) =>
      purchaseRequestService.updatePurchaseRequest(id, data),
    onSuccess: (_, variables) => {
      invalidateListQueries(queryClient, 'purchaseRequests');
      invalidateDetailQuery(queryClient, 'purchaseRequests', variables.id);
      notificationService.showSuccess('Purchase request updated successfully');
    },
    onError: (error: any) => {
      let message = 'Failed to update purchase request';
      if (error.response?.data) {
        if (error.response.data.message) {
          message = error.response.data.message;
        } else if (error.response.data.error) {
          message = error.response.data.error;
        } else if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          const errorDetails = error.response.data.errors
            .map((e: any) => `${e.field || 'field'}: ${e.message || e}`)
            .join(', ');
          message = `Validation errors: ${errorDetails}`;
        }
      }
      console.error('Update purchase request error:', error.response?.data || error);
      notificationService.showError(message);
    },
  });
};

export const useSubmitPurchaseRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => purchaseRequestService.submitPurchaseRequest(id),
    onSuccess: (_, id) => {
      invalidateListQueries(queryClient, 'purchaseRequests');
      invalidateDetailQuery(queryClient, 'purchaseRequests', id);
      // Also invalidate RFQs since submitting a PR might create RFQs
      invalidateListQueries(queryClient, 'rfqs');
      notificationService.showSuccess('Purchase request submitted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to submit purchase request';
      notificationService.showError(message);
    },
  });
};

export const useDeletePurchaseRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => purchaseRequestService.deletePurchaseRequest(id),
    onSuccess: () => {
      invalidateListQueries(queryClient, 'purchaseRequests');
      notificationService.showSuccess('Purchase request deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete purchase request';
      notificationService.showError(message);
    },
  });
};

export const useApprovePurchaseRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: { notes?: string; rfqTypes?: string[] } }) =>
      purchaseRequestService.approvePurchaseRequest(id, data),
    onSuccess: (_, variables) => {
      invalidateListQueries(queryClient, 'purchaseRequests');
      invalidateDetailQuery(queryClient, 'purchaseRequests', variables.id);
      // Also invalidate RFQs since approval might trigger RFQ creation
      invalidateListQueries(queryClient, 'rfqs');
      notificationService.showSuccess('Purchase request approved successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to approve purchase request';
      notificationService.showError(message);
    },
  });
};