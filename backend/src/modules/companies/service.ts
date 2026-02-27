import { CompanyRepository } from './repository';
import { CreateCompanyDto, UpdateCompanyDto, CompanyResponse } from './types';
import { AppError } from '../../middlewares/error.middleware';
import { ICompany } from './schema';
import { Status } from '../../types/common';
import { CategoryRoutingEventEmitter, CategoryEvent } from '../category-routing/events';

export class CompanyService {
  private repository: CompanyRepository;

  constructor() {
    this.repository = new CompanyRepository();
  }

  /**
   * Create a new company
   * Companies are created with PENDING status and must be approved by Admin
   */
  async createCompany(data: CreateCompanyDto): Promise<CompanyResponse> {
    // Check if registration number already exists
    const regExists = await this.repository.registrationNumberExists(
      data.registrationNumber
    );
    if (regExists) {
      throw new AppError('Registration number already exists', 400);
    }

    // Create company with PENDING status (default, but explicitly set for clarity)
    const company = await this.repository.create({
      ...data,
      documents: (data.documents || []).map(doc => ({
        ...doc,
        uploadedAt: new Date(),
      })),
      status: Status.PENDING, // Companies start as pending, require admin approval
    });

    return this.toCompanyResponse(company);
  }

  /**
   * Get company by ID
   */
  async getCompanyById(id: string): Promise<CompanyResponse> {
    const company = await this.repository.findById(id);
    if (!company) {
      throw new AppError('Company not found', 404);
    }
    return this.toCompanyResponse(company);
  }

  /**
   * Get companies by type and status
   */
  async getCompanies(
    type?: string,
    status?: string
  ): Promise<CompanyResponse[]> {
    const companies = await this.repository.findByTypeAndStatus(
      type as any,
      status as any
    );
    return companies.map((company) => this.toCompanyResponse(company));
  }

  /**
   * Update company
   * Note: Status changes must be done through approve/reject endpoints (admin only)
   */
  async updateCompany(
    id: string,
    data: UpdateCompanyDto,
    isAdmin: boolean = false
  ): Promise<CompanyResponse> {
    const company = await this.repository.findById(id);
    if (!company) {
      throw new AppError('Company not found', 404);
    }

    // Only admin can change company status directly
    // Regular users must use approve/reject endpoints
    if (data.status && !isAdmin) {
      throw new AppError('Only admin can change company status. Use approve/reject endpoints.', 403);
    }

    // Prepare update data with proper types
    const updateData: Partial<ICompany> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.address !== undefined) {
      // Only update if all required fields are provided
      if (data.address.street && data.address.city && data.address.state && data.address.country && data.address.zipCode) {
        updateData.address = {
          street: data.address.street,
          city: data.address.city,
          state: data.address.state,
          country: data.address.country,
          zipCode: data.address.zipCode,
        };
      }
    }
    if (data.documents !== undefined) {
      updateData.documents = data.documents.map(doc => ({
        ...doc,
        uploadedAt: new Date(),
      }));
    }

    const updatedCompany = await this.repository.update(id, updateData);
    if (!updatedCompany) {
      throw new AppError('Failed to update company', 500);
    }

    return this.toCompanyResponse(updatedCompany);
  }

  /**
   * Delete company (soft delete)
   */
  async deleteCompany(id: string): Promise<void> {
    const company = await this.repository.findById(id);
    if (!company) {
      throw new AppError('Company not found', 404);
    }

    await this.repository.softDelete(id);
  }

  /**
   * Add document to company
   */
  async addDocument(
    id: string,
    document: { type: string; url: string }
  ): Promise<CompanyResponse> {
    const company = await this.repository.findById(id);
    if (!company) {
      throw new AppError('Company not found', 404);
    }

    const updatedCompany = await this.repository.addDocument(id, document);
    if (!updatedCompany) {
      throw new AppError('Failed to add document', 500);
    }

    return this.toCompanyResponse(updatedCompany);
  }

  /**
   * Approve company (Admin only)
   */
  async approveCompany(id: string): Promise<CompanyResponse> {
    const company = await this.repository.findById(id);
    if (!company) {
      throw new AppError('Company not found', 404);
    }

    if (company.status === Status.APPROVED) {
      throw new AppError('Company is already approved', 400);
    }

    const oldStatus = company.status;
    const updatedCompany = await this.repository.update(id, {
      status: Status.APPROVED,
    });

    if (!updatedCompany) {
      throw new AppError('Failed to approve company', 500);
    }

    // Emit event for company status change (affects routing)
    CategoryRoutingEventEmitter.emit(CategoryEvent.COMPANY_STATUS_CHANGED, {
      companyId: id,
      oldStatus,
      newStatus: Status.APPROVED,
    });

    return this.toCompanyResponse(updatedCompany);
  }

  /**
   * Reject company (Admin only)
   */
  async rejectCompany(id: string): Promise<CompanyResponse> {
    const company = await this.repository.findById(id);
    if (!company) {
      throw new AppError('Company not found', 404);
    }

    if (company.status === Status.REJECTED) {
      throw new AppError('Company is already rejected', 400);
    }

    const oldStatus = company.status;
    const updatedCompany = await this.repository.update(id, {
      status: Status.REJECTED,
    });

    if (!updatedCompany) {
      throw new AppError('Failed to reject company', 500);
    }

    // Emit event for company status change (affects routing)
    CategoryRoutingEventEmitter.emit(CategoryEvent.COMPANY_STATUS_CHANGED, {
      companyId: id,
      oldStatus,
      newStatus: Status.REJECTED,
    });

    return this.toCompanyResponse(updatedCompany);
  }

  /**
   * Convert ICompany to CompanyResponse
   */
  private toCompanyResponse(company: ICompany): CompanyResponse {
    return {
      id: company._id.toString(),
      name: company.name,
      registrationNumber: company.registrationNumber,
      type: company.type,
      email: company.email,
      phone: company.phone,
      address: company.address,
      documents: company.documents,
      status: company.status,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }
}
