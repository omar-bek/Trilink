import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractService } from '@/services/contract.service';
import {
  Contract,
  SignContractDto,
  ContractFilters,
  CreateContractDto,
  UpdateContractDto,
  CreateAmendmentDto,
  ApproveAmendmentDto,
  ContractVersion,
  VersionDiff,
} from '@/types/contract';
import { PaginationParams } from '@/utils/pagination';
import { notificationService } from '@/utils/notification';
import { queryKeys, invalidateListQueries, invalidateDetailQuery } from '@/lib/queryKeys';

export const useContracts = (filters?: ContractFilters, pagination?: PaginationParams) => {
  return useQuery({
    queryKey: queryKeys.contracts.list(filters, pagination),
    queryFn: () => contractService.getContracts(filters, pagination),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useContract = (id: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.contracts.detail(id!),
    queryFn: () => contractService.getContractById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContractDto) => contractService.createContract(data),
    onSuccess: () => {
      invalidateListQueries(queryClient, 'contracts');
      notificationService.showSuccess('Contract created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create contract';
      notificationService.showError(message);
    },
  });
};

export const useUpdateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContractDto }) =>
      contractService.updateContract(id, data),
    onSuccess: (_, variables) => {
      invalidateListQueries(queryClient, 'contracts');
      invalidateDetailQuery(queryClient, 'contracts', variables.id);
      notificationService.showSuccess('Contract updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update contract';
      notificationService.showError(message);
    },
  });
};

export const useDeleteContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contractService.deleteContract(id),
    onSuccess: () => {
      invalidateListQueries(queryClient, 'contracts');
      notificationService.showSuccess('Contract deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete contract';
      notificationService.showError(message);
    },
  });
};

export const useSignContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SignContractDto }) =>
      contractService.signContract(id, data),
    onSuccess: (_, variables) => {
      invalidateListQueries(queryClient, 'contracts');
      invalidateDetailQuery(queryClient, 'contracts', variables.id);
      notificationService.showSuccess('Contract signed successfully');
    },
    onError: (error: any) => {
      // Get detailed error message from backend
      const errorMessage = 
        error.response?.data?.error || 
        error.response?.data?.message || 
        error.message || 
        'Failed to sign contract';
      
      // Log full error for debugging
      console.error('Sign contract error:', {
        message: errorMessage,
        status: error.response?.status,
        data: error.response?.data,
      });
      
      notificationService.showError(errorMessage);
    },
  });
};

export const useActivateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contractService.activateContract(id),
    onSuccess: (_, id) => {
      invalidateListQueries(queryClient, 'contracts');
      invalidateDetailQuery(queryClient, 'contracts', id);
      notificationService.showSuccess('Contract activated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to activate contract';
      notificationService.showError(message);
    },
  });
};

export const useGetContractPdf = () => {
  return useMutation({
    mutationFn: (id: string) => contractService.getContractPdf(id),
    onSuccess: (blob, id) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contract-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      notificationService.showSuccess('Contract PDF downloaded successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to download contract PDF';
      notificationService.showError(message);
    },
  });
};

// Amendment hooks
export const useContractAmendments = (contractId: string, filters?: { status?: string }) => {
  return useQuery({
    queryKey: ['contracts', contractId, 'amendments', filters],
    queryFn: () => contractService.getContractAmendments(contractId, filters),
    enabled: !!contractId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useAmendment = (contractId: string, amendmentId: string) => {
  return useQuery({
    queryKey: ['contracts', contractId, 'amendments', amendmentId],
    queryFn: () => contractService.getAmendmentById(contractId, amendmentId),
    enabled: !!contractId && !!amendmentId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateAmendment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contractId, data }: { contractId: string; data: CreateAmendmentDto }) =>
      contractService.createAmendment(contractId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['contracts', variables.contractId, 'amendments'],
      });
      invalidateDetailQuery(queryClient, 'contracts', variables.contractId);
      notificationService.showSuccess('Amendment created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create amendment';
      notificationService.showError(message);
    },
  });
};

export const useApproveAmendment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contractId,
      amendmentId,
      data,
    }: {
      contractId: string;
      amendmentId: string;
      data: ApproveAmendmentDto;
    }) => contractService.approveAmendment(contractId, amendmentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['contracts', variables.contractId, 'amendments'],
      });
      invalidateDetailQuery(queryClient, 'contracts', variables.contractId);
      notificationService.showSuccess(
        variables.data.approved
          ? 'Amendment approved successfully'
          : 'Amendment rejected successfully'
      );
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to process amendment';
      notificationService.showError(message);
    },
  });
};

// Version history hooks
export const useVersionHistory = (contractId: string | undefined) => {
  return useQuery({
    queryKey: ['contracts', contractId, 'versions'],
    queryFn: () => contractService.getVersionHistory(contractId!),
    enabled: !!contractId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useContractVersion = (contractId: string | undefined, version: number | undefined) => {
  return useQuery({
    queryKey: ['contracts', contractId, 'versions', version],
    queryFn: () => contractService.getContractVersion(contractId!, version!),
    enabled: !!contractId && !!version,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCompareVersions = (contractId: string | undefined, version1: number | undefined, version2: number | undefined) => {
  return useQuery({
    queryKey: ['contracts', contractId, 'versions', 'compare', version1, version2],
    queryFn: () => contractService.compareVersions(contractId!, version1!, version2!),
    enabled: !!contractId && !!version1 && !!version2,
    staleTime: 2 * 60 * 1000,
  });
};
