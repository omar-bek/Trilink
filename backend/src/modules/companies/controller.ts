import { Request, Response, NextFunction } from 'express';
import { CompanyService } from './service';
import { CreateCompanyDto, UpdateCompanyDto } from './types';
import { ApiResponse } from '../../types/common';
import { getRequestId } from '../../utils/requestId';
import { Role } from '../../config/rbac';

export class CompanyController {
  private service: CompanyService;

  constructor() {
    this.service = new CompanyService();
  }

  /**
   * Create a new company
   * POST /api/companies
   */
  createCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data: CreateCompanyDto = req.body;
      const company = await this.service.createCompany(data);

      const response: ApiResponse = {
        success: true,
        data: company,
        requestId: getRequestId(req),
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get company by ID
   * GET /api/companies/:id
   */
  getCompanyById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const company = await this.service.getCompanyById(id);

      const response: ApiResponse = {
        success: true,
        data: company,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get companies
   * GET /api/companies
   */
  getCompanies = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { type, status } = req.query;
      const companies = await this.service.getCompanies(
        type as string,
        status as string
      );

      const response: ApiResponse = {
        success: true,
        data: companies,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update company
   * PATCH /api/companies/:id
   * Note: Status changes require admin role and should use approve/reject endpoints
   */
  updateCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const data: UpdateCompanyDto = req.body;
      const isAdmin = req.user?.role === Role.ADMIN;
      const company = await this.service.updateCompany(id, data, isAdmin);

      const response: ApiResponse = {
        success: true,
        data: company,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete company (soft delete)
   * DELETE /api/companies/:id
   */
  deleteCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.deleteCompany(id);

      const response: ApiResponse = {
        success: true,
        data: { message: 'Company deleted successfully' },
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add document to company
   * POST /api/companies/:id/documents
   */
  addDocument = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const document = req.body;
      const company = await this.service.addDocument(id, document);

      const response: ApiResponse = {
        success: true,
        data: company,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Approve company (Admin only)
   * POST /api/companies/:id/approve
   */
  approveCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const company = await this.service.approveCompany(id);

      const response: ApiResponse = {
        success: true,
        data: company,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reject company (Admin only)
   * POST /api/companies/:id/reject
   */
  rejectCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const company = await this.service.rejectCompany(id);

      const response: ApiResponse = {
        success: true,
        data: company,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
