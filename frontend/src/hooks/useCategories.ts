import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '@/services/category.service';
import { CreateCategoryDto, UpdateCategoryDto } from '@/types/category';
import { notificationService } from '@/utils/notification';
import { queryKeys } from '@/lib/queryKeys';

export const useRootCategories = () => {
  return useQuery({
    queryKey: ['categories', 'root'],
    queryFn: async () => {
      try {
        const result = await categoryService.getRootCategories();
        // If no root categories, try to get all active categories and filter root ones
        if (!result.data || result.data.length === 0) {
          console.warn('[useRootCategories] No root categories found, trying /categories/all...');
          const allCategories = await categoryService.getAllCategories(false);
          if (allCategories.data && Array.isArray(allCategories.data)) {
            // Filter root categories (level 0)
            const rootCategories = allCategories.data.filter((cat: any) => 
              cat.level === 0 || !cat.parentId
            );
            if (rootCategories.length > 0) {
              console.log('[useRootCategories] Found', rootCategories.length, 'root categories from /all endpoint');
              return {
                ...result,
                data: rootCategories,
              };
            }
          }
        }
        return result;
      } catch (error) {
        console.error('[useRootCategories] Error:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2, // Retry twice on failure
  });
};

export const useCategoryTree = () => {
  return useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: () => categoryService.getCategoryTree(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCategory = (id: string | undefined) => {
  return useQuery({
    queryKey: ['categories', 'detail', id],
    queryFn: () => categoryService.getCategoryById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCategoryChildren = (id: string | undefined) => {
  return useQuery({
    queryKey: ['categories', 'children', id],
    queryFn: () => categoryService.getCategoryChildren(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAllCategories = (includeInactive = false) => {
  return useQuery({
    queryKey: ['categories', 'all', includeInactive],
    queryFn: () => categoryService.getAllCategories(includeInactive),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCategoryStats = () => {
  return useQuery({
    queryKey: ['categories', 'stats'],
    queryFn: () => categoryService.getCategoryStats(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryDto) => categoryService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      notificationService.showSuccess('Category created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create category';
      notificationService.showError(message);
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryDto }) =>
      categoryService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      notificationService.showSuccess('Category updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update category';
      notificationService.showError(message);
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoryService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      notificationService.showSuccess('Category deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete category';
      notificationService.showError(message);
    },
  });
};
