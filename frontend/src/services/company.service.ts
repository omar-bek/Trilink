import api from './api';
import { ApiResponse } from '@/types';
import { Company, UpdateCompanyDto, AddCompanyDocumentDto, CreateCompanyDto, CompanyFilters } from '@/types/company';

export const companyService = {
  /**
   * Get all companies
   * GET /api/companies
   */
  getCompanies: async (filters?: CompanyFilters): Promise<ApiResponse<Company[]>> => {
    const response = await api.get<ApiResponse<Company[]>>('/companies', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get company by ID
   * GET /api/companies/:id
   */
  getCompanyById: async (companyId: string): Promise<ApiResponse<Company>> => {
    const response = await api.get<ApiResponse<Company>>(`/companies/${companyId}`);
    return response.data;
  },

  /**
   * Create a new company
   * POST /api/companies
   */
  createCompany: async (data: CreateCompanyDto): Promise<ApiResponse<Company>> => {
    const response = await api.post<ApiResponse<Company>>('/companies', data);
    return response.data;
  },

  /**
   * Update company
   * PATCH /api/companies/:id
   * Note: Only admin can update company status
   */
  updateCompany: async (
    companyId: string,
    data: UpdateCompanyDto
  ): Promise<ApiResponse<Company>> => {
    const response = await api.patch<ApiResponse<Company>>(`/companies/${companyId}`, data);
    return response.data;
  },

  /**
   * Delete company (soft delete)
   * DELETE /api/companies/:id
   */
  deleteCompany: async (companyId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/companies/${companyId}`);
    return response.data;
  },

  /**
   * Add document to company
   * POST /api/companies/:id/documents
   */
  addDocument: async (
    companyId: string,
    document: AddCompanyDocumentDto
  ): Promise<ApiResponse<Company>> => {
    const response = await api.post<ApiResponse<Company>>(
      `/companies/${companyId}/documents`,
      document
    );
    return response.data;
  },

  /**
   * Approve company (Admin only)
   * POST /api/companies/:id/approve
   */
  approveCompany: async (companyId: string): Promise<ApiResponse<Company>> => {
    const response = await api.post<ApiResponse<Company>>(`/companies/${companyId}/approve`);
    return response.data;
  },

  /**
   * Reject company (Admin only)
   * POST /api/companies/:id/reject
   */
  rejectCompany: async (companyId: string): Promise<ApiResponse<Company>> => {
    const response = await api.post<ApiResponse<Company>>(`/companies/${companyId}/reject`);
    return response.data;
  },
};
