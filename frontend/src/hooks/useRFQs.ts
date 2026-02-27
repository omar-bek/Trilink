import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rfqService } from '@/services/rfq.service';
import { PaginationParams } from '@/utils/pagination';
import { RFQFilters, CreateRFQDto, UpdateRFQDto } from '@/types/rfq';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { queryKeys, invalidateListQueries, invalidateDetailQuery } from '@/lib/queryKeys';
import { notificationService } from '@/utils/notification';

/**
 * Hook to fetch RFQs based on user role
 * Buyers see their own RFQs, Providers see available RFQs
 * Supports server-side filtering, search, and pagination
 */
export const useRFQs = (filters?: RFQFilters, pagination?: PaginationParams) => {
  const { user } = useAuthStore();
  const role = user?.role as Role;

  // Buyers see their company's RFQs, Providers see available RFQs
  const isBuyer = role === Role.BUYER || role === Role.ADMIN || role === Role.GOVERNMENT || role === Role.COMPANY_MANAGER;

  return useQuery({
    queryKey: queryKeys.rfqs.list(filters, pagination, role),
    queryFn: () => {
      if (isBuyer) {
        return rfqService.getRFQs(filters, pagination);
      } else {
        // Providers see available RFQs filtered by their role
        return rfqService.getAvailableRFQs(
          {
            ...filters,
            targetRole: role,
          },
          pagination
        );
      }
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on permission errors (403)
      if (error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

export const useRFQ = (id: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.rfqs.detail(id!),
    queryFn: () => rfqService.getRFQById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export const useRFQsByPurchaseRequest = (purchaseRequestId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.rfqs.byPurchaseRequest(purchaseRequestId!),
    queryFn: () => rfqService.getRFQsByPurchaseRequest(purchaseRequestId!),
    enabled: !!purchaseRequestId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateRFQ = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRFQDto) => rfqService.createRFQ(data),
    onSuccess: () => {
      invalidateListQueries(queryClient, 'rfqs');
      notificationService.showSuccess('RFQ created successfully');
    },
    onError: (error: any) => {
      const errorData = error.response?.data;
      let message = 'Failed to create RFQ';
      
      if (errorData?.error === 'Validation error') {
        message = errorData.message || 'Please check the RFQ details and try again';
      } else if (error.response?.status === 403) {
        message = 'You do not have permission to create RFQs';
      } else if (error.response?.status === 400) {
        message = errorData?.message || 'Invalid RFQ data';
      } else {
        message = errorData?.message || error.message || message;
      }
      
      notificationService.showError(message);
    },
  });
};

export const useUpdateRFQ = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRFQDto }) =>
      rfqService.updateRFQ(id, data),
    onSuccess: (_, variables) => {
      invalidateListQueries(queryClient, 'rfqs');
      invalidateDetailQuery(queryClient, 'rfqs', variables.id);
      notificationService.showSuccess('RFQ updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update RFQ';
      notificationService.showError(message);
    },
  });
};

export const useDeleteRFQ = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rfqService.deleteRFQ(id),
    onSuccess: () => {
      invalidateListQueries(queryClient, 'rfqs');
      notificationService.showSuccess('RFQ deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete RFQ';
      notificationService.showError(message);
    },
  });
};

export const useCompareBids = (rfqId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.rfqs.bidsCompare(rfqId!),
    queryFn: () => rfqService.compareBids(rfqId!),
    enabled: !!rfqId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useEnableRFQAnonymity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rfqService.enableAnonymity(id),
    onSuccess: (_, id) => {
      invalidateDetailQuery(queryClient, 'rfqs', id);
      invalidateListQueries(queryClient, 'rfqs');
      notificationService.showSuccess('Anonymity enabled successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to enable anonymity';
      notificationService.showError(message);
    },
  });
};

export const useRevealRFQIdentity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rfqService.revealIdentity(id),
    onSuccess: (_, id) => {
      invalidateDetailQuery(queryClient, 'rfqs', id);
      invalidateListQueries(queryClient, 'rfqs');
      notificationService.showSuccess('Identity revealed successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to reveal identity';
      notificationService.showError(message);
    },
  });
};