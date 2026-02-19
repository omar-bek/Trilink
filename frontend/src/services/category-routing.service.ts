import api from './api';
import { ApiResponse } from '@/types';

export interface MatchedCompany {
  companyId: string;
  companyName: string;
  categoryId: string;
  categoryName: string;
  matchType: 'exact' | 'parent' | 'subcategory';
}

export const categoryRoutingService = {
  findMatchingCompanies: async (
    categoryId: string,
    subCategoryId?: string
  ): Promise<ApiResponse<MatchedCompany[]>> => {
    const params = new URLSearchParams();
    params.append('categoryId', categoryId);
    if (subCategoryId) {
      params.append('subCategoryId', subCategoryId);
    }
    const response = await api.get<ApiResponse<MatchedCompany[]>>(
      `/category-routing/match?${params.toString()}`
    );
    return response.data;
  },

  canCompanyViewPurchaseRequest: async (
    companyId: string,
    categoryId: string,
    subCategoryId?: string
  ): Promise<ApiResponse<{ canView: boolean }>> => {
    const params = new URLSearchParams();
    params.append('companyId', companyId);
    params.append('categoryId', categoryId);
    if (subCategoryId) {
      params.append('subCategoryId', subCategoryId);
    }
    const response = await api.get<ApiResponse<{ canView: boolean }>>(
      `/category-routing/can-view?${params.toString()}`
    );
    return response.data;
  },
};
