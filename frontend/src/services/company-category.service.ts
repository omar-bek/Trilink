import api from './api';
import { ApiResponse } from '@/types';
import { Category } from '@/types/category';

export const companyCategoryService = {
  getCompanyCategories: async (companyId: string): Promise<ApiResponse<Category[]>> => {
    const response = await api.get<ApiResponse<Category[]>>(`/companies/${companyId}/categories`);
    return response.data;
  },

  addCategoriesToCompany: async (
    companyId: string,
    categoryIds: string[]
  ): Promise<ApiResponse<Category[]>> => {
    const response = await api.post<ApiResponse<Category[]>>(
      `/companies/${companyId}/categories`,
      { categoryIds }
    );
    return response.data;
  },

  removeCategoryFromCompany: async (
    companyId: string,
    categoryId: string
  ): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(
      `/companies/${companyId}/categories/${categoryId}`
    );
    return response.data;
  },
};
