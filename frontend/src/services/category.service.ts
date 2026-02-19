import api from './api';
import { ApiResponse } from '@/types';
import { Category, CategoryTree, CreateCategoryDto, UpdateCategoryDto } from '@/types/category';

export const categoryService = {
    getRootCategories: async (): Promise<ApiResponse<Category[]>> => {
        const response = await api.get<ApiResponse<Category[]>>('/categories');
        return response.data;
    },

    getCategoryTree: async (): Promise<ApiResponse<CategoryTree[]>> => {
        const response = await api.get<ApiResponse<CategoryTree[]>>('/categories/tree');
        return response.data;
    },

    getCategoryById: async (id: string): Promise<ApiResponse<Category>> => {
        const response = await api.get<ApiResponse<Category>>(`/categories/${id}`);
        return response.data;
    },

    getCategoryChildren: async (id: string): Promise<ApiResponse<Category[]>> => {
        const response = await api.get<ApiResponse<Category[]>>(`/categories/${id}/children`);
        return response.data;
    },

    getAllCategories: async (includeInactive = false): Promise<ApiResponse<Category[]>> => {
        // Public endpoint for active categories only
        if (!includeInactive) {
            const response = await api.get<ApiResponse<Category[]>>('/categories/all');
            return response.data;
        }
        // Admin endpoint for all categories including inactive
        const params = includeInactive ? '?includeInactive=true' : '';
        const response = await api.get<ApiResponse<Category[]>>(`/categories/admin/all${params}`);
        return response.data;
    },

    createCategory: async (data: CreateCategoryDto): Promise<ApiResponse<Category>> => {
        const response = await api.post<ApiResponse<Category>>('/categories', data);
        return response.data;
    },

    updateCategory: async (id: string, data: UpdateCategoryDto): Promise<ApiResponse<Category>> => {
        const response = await api.put<ApiResponse<Category>>(`/categories/${id}`, data);
        return response.data;
    },

    deleteCategory: async (id: string): Promise<ApiResponse<void>> => {
        const response = await api.delete<ApiResponse<void>>(`/categories/${id}`);
        return response.data;
    },

    getCategoryStats: async (): Promise<ApiResponse<any>> => {
        const response = await api.get<ApiResponse<any>>('/categories/stats');
        return response.data;
    },
};
