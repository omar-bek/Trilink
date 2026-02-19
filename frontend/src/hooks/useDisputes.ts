import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { disputeService } from '@/services/dispute.service';
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
import { notificationService } from '@/utils/notification';
import { queryKeys, invalidateListQueries, invalidateDetailQuery } from '@/lib/queryKeys';

export const useDisputes = (filters?: DisputeFilters, pagination?: PaginationParams) => {
  return useQuery({
    queryKey: queryKeys.disputes.list(filters, pagination),
    queryFn: () => disputeService.getDisputes(filters, pagination),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useEscalatedDisputes = () => {
  return useQuery({
    queryKey: queryKeys.disputes.escalated(),
    queryFn: () => disputeService.getEscalatedDisputes(),
    staleTime: 2 * 60 * 1000,
  });
};

export const useDispute = (id: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.disputes.detail(id!),
    queryFn: () => disputeService.getDisputeById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateDispute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDisputeDto) => disputeService.createDispute(data),
    onSuccess: () => {
      invalidateListQueries(queryClient, 'disputes');
      notificationService.showSuccess('Dispute created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create dispute';
      notificationService.showError(message);
    },
  });
};

export const useEscalateDispute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EscalateDisputeDto }) =>
      disputeService.escalateDispute(id, data),
    onSuccess: (_, variables) => {
      invalidateListQueries(queryClient, 'disputes');
      invalidateDetailQuery(queryClient, 'disputes', variables.id);
      // Invalidate escalated disputes list
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes.escalated() });
      notificationService.showSuccess('Dispute escalated to government');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to escalate dispute';
      notificationService.showError(message);
    },
  });
};

export const useResolveDispute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResolveDisputeDto }) =>
      disputeService.resolveDispute(id, data),
    onSuccess: (_, variables) => {
      invalidateListQueries(queryClient, 'disputes');
      invalidateDetailQuery(queryClient, 'disputes', variables.id);
      // Invalidate escalated disputes list (dispute might be removed from escalated)
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes.escalated() });
      notificationService.showSuccess('Dispute resolved successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to resolve dispute';
      notificationService.showError(message);
    },
  });
};

export const useAddAttachments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddAttachmentDto }) =>
      disputeService.addAttachments(id, data),
    onSuccess: (_, variables) => {
      invalidateListQueries(queryClient, 'disputes');
      invalidateDetailQuery(queryClient, 'disputes', variables.id);
      notificationService.showSuccess('Attachments added successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to add attachments';
      notificationService.showError(message);
    },
  });
};

export const useDisputesAssignedToMe = (filters?: { status?: string }) => {
  return useQuery({
    queryKey: ['disputes', 'assigned-to-me', filters],
    queryFn: () => disputeService.getDisputesAssignedToMe(filters),
    staleTime: 2 * 60 * 1000,
  });
};

export const useUpdateDispute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDisputeDto }) =>
      disputeService.updateDispute(id, data),
    onSuccess: (_, variables) => {
      invalidateListQueries(queryClient, 'disputes');
      invalidateDetailQuery(queryClient, 'disputes', variables.id);
      notificationService.showSuccess('Dispute updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update dispute';
      notificationService.showError(message);
    },
  });
};

export const useAssignDispute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignDisputeDto }) =>
      disputeService.assignDispute(id, data),
    onSuccess: (_, variables) => {
      invalidateListQueries(queryClient, 'disputes');
      invalidateDetailQuery(queryClient, 'disputes', variables.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.disputes.escalated() });
      notificationService.showSuccess('Dispute assigned successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to assign dispute';
      notificationService.showError(message);
    },
  });
};

export const useDeleteDispute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => disputeService.deleteDispute(id),
    onSuccess: () => {
      invalidateListQueries(queryClient, 'disputes');
      notificationService.showSuccess('Dispute deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete dispute';
      notificationService.showError(message);
    },
  });
};
