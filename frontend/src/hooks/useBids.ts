import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bidService } from '@/services/bid.service';
import { PaginationParams } from '@/utils/pagination';
import {
  Bid,
  CreateBidDto,
  UpdateBidDto,
  EvaluateBidDto,
  BidFilters,
} from '@/types/bid';
import { notificationService } from '@/utils/notification';
import { queryKeys, invalidateListQueries, invalidateDetailQuery } from '@/lib/queryKeys';

export const useBids = (filters?: BidFilters, pagination?: PaginationParams) => {
  return useQuery({
    queryKey: queryKeys.bids.list(filters, pagination),
    queryFn: () => bidService.getBids(filters, pagination),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useBidsByRFQ = (rfqId: string | undefined, filters?: { status?: string }) => {
  return useQuery({
    queryKey: queryKeys.bids.byRFQ(rfqId!, filters),
    queryFn: () => bidService.getBidsByRFQ(rfqId!, filters),
    enabled: !!rfqId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useBid = (id: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.bids.detail(id!),
    queryFn: () => bidService.getBidById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateBid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBidDto) => bidService.createBid(data),
    onSuccess: (response, variables) => {
      // Invalidate all bid list queries (including filtered and paginated)
      invalidateListQueries(queryClient, 'bids');
      // Also invalidate RFQ-specific bid lists if RFQ ID is present
      // Invalidate all variations (with and without filters)
      const rfqId = response.data?.rfqId || variables.rfqId;
      if (rfqId) {
        // Invalidate all queries that start with ['bids', 'byRFQ', rfqId]
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.bids.byRFQ(rfqId),
          exact: false, // Invalidate all queries that start with this key (with or without filters)
        });
        // Also refetch immediately to update UI
        queryClient.refetchQueries({ 
          queryKey: queryKeys.bids.byRFQ(rfqId),
          exact: false,
        });
      }
      notificationService.showSuccess('Bid created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create bid';
      notificationService.showError(message);
    },
  });
};

export const useUpdateBid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBidDto }) =>
      bidService.updateBid(id, data),
    onSuccess: (_, variables) => {
      // Invalidate all bid lists to reflect updated bid
      invalidateListQueries(queryClient, 'bids');
      // Invalidate specific bid detail
      invalidateDetailQuery(queryClient, 'bids', variables.id);
      notificationService.showSuccess('Bid updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update bid';
      notificationService.showError(message);
    },
  });
};

export const useWithdrawBid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bidService.withdrawBid(id),
    onSuccess: (_, id) => {
      // Invalidate all bid lists
      invalidateListQueries(queryClient, 'bids');
      // Invalidate specific bid detail
      invalidateDetailQuery(queryClient, 'bids', id);
      notificationService.showSuccess('Bid withdrawn successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to withdraw bid';
      notificationService.showError(message);
    },
  });
};

export const useEvaluateBid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EvaluateBidDto }) =>
      bidService.evaluateBid(id, data),
    onSuccess: (_, variables) => {
      // Invalidate all bid lists
      invalidateListQueries(queryClient, 'bids');
      // Invalidate specific bid detail
      invalidateDetailQuery(queryClient, 'bids', variables.id);
      notificationService.showSuccess('Bid evaluated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to evaluate bid';
      notificationService.showError(message);
    },
  });
};

export const useDeleteBid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bidService.deleteBid(id),
    onSuccess: () => {
      // Invalidate all bid lists
      invalidateListQueries(queryClient, 'bids');
      // Note: We don't invalidate detail query since item is deleted
      notificationService.showSuccess('Bid deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete bid';
      notificationService.showError(message);
    },
  });
};

export const useEnableBidAnonymity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bidService.enableAnonymity(id),
    onSuccess: (_, id) => {
      invalidateDetailQuery(queryClient, 'bids', id);
      invalidateListQueries(queryClient, 'bids');
      notificationService.showSuccess('Anonymity enabled successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to enable anonymity';
      notificationService.showError(message);
    },
  });
};

export const useRevealBidIdentity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bidService.revealIdentity(id),
    onSuccess: (_, id) => {
      invalidateDetailQuery(queryClient, 'bids', id);
      invalidateListQueries(queryClient, 'bids');
      notificationService.showSuccess('Identity revealed successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to reveal identity';
      notificationService.showError(message);
    },
  });
};