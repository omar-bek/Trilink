import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services/company.service';
import {
  UpdateCompanyDto,
  AddCompanyDocumentDto,
  CreateCompanyDto,
  CompanyFilters,
} from '@/types/company';
import { queryKeys, invalidateListQueries, invalidateDetailQuery } from '@/lib/queryKeys';
import { notificationService } from '@/utils/notification';

export const useCompany = (companyId: string) => {
  return useQuery({
    queryKey: queryKeys.company.detail(companyId),
    queryFn: () => companyService.getCompanyById(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 403 (permission denied) or 404 (not found)
      if (error?.response?.status === 403 || error?.response?.status === 404) {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
  });
};

export const useCompanies = (filters?: CompanyFilters) => {
  return useQuery({
    queryKey: queryKeys.companies.list(filters),
    queryFn: () => companyService.getCompanies(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCompanyDto) => companyService.createCompany(data),
    onSuccess: () => {
      invalidateListQueries(queryClient, 'companies');
      notificationService.showSuccess('Company created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create company';
      notificationService.showError(message);
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, data }: { companyId: string; data: UpdateCompanyDto }) =>
      companyService.updateCompany(companyId, data),
    onSuccess: (_, variables) => {
      invalidateListQueries(queryClient, 'companies');
      invalidateDetailQuery(queryClient, 'company', variables.companyId);
      notificationService.showSuccess('Company updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update company';
      notificationService.showError(message);
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companyId: string) => companyService.deleteCompany(companyId),
    onSuccess: () => {
      invalidateListQueries(queryClient, 'companies');
      notificationService.showSuccess('Company deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete company';
      notificationService.showError(message);
    },
  });
};

export const useApproveCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companyId: string) => companyService.approveCompany(companyId),
    onSuccess: (_, companyId) => {
      invalidateListQueries(queryClient, 'companies');
      invalidateDetailQuery(queryClient, 'company', companyId);
      notificationService.showSuccess('Company approved successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to approve company';
      notificationService.showError(message);
    },
  });
};

export const useRejectCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companyId: string) => companyService.rejectCompany(companyId),
    onSuccess: (_, companyId) => {
      invalidateListQueries(queryClient, 'companies');
      invalidateDetailQuery(queryClient, 'company', companyId);
      notificationService.showSuccess('Company rejected successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to reject company';
      notificationService.showError(message);
    },
  });
};

export const useAddCompanyDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      companyId,
      document,
    }: {
      companyId: string;
      document: AddCompanyDocumentDto;
    }) => companyService.addDocument(companyId, document),
    onSuccess: (response, variables) => {
      invalidateDetailQuery(queryClient, 'company', variables.companyId);
      invalidateListQueries(queryClient, 'companies');
      notificationService.showSuccess('Document added successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to add document';
      notificationService.showError(message);
    },
  });
};
