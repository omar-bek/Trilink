import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyCategoryService } from '@/services/company-category.service';
import { notificationService } from '@/utils/notification';

export const useCompanyCategories = (companyId: string | undefined) => {
  return useQuery({
    queryKey: ['companyCategories', companyId],
    queryFn: () => companyCategoryService.getCompanyCategories(companyId!),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAddCategoriesToCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, categoryIds }: { companyId: string; categoryIds: string[] }) =>
      companyCategoryService.addCategoriesToCompany(companyId, categoryIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companyCategories', variables.companyId] });
      notificationService.showSuccess('Categories added successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to add categories';
      notificationService.showError(message);
    },
  });
};

export const useRemoveCategoryFromCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, categoryId }: { companyId: string; categoryId: string }) =>
      companyCategoryService.removeCategoryFromCompany(companyId, categoryId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companyCategories', variables.companyId] });
      notificationService.showSuccess('Category removed successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to remove category';
      notificationService.showError(message);
    },
  });
};
