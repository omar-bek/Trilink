import { Request, Response, NextFunction } from 'express';
import { ContractService } from './service';
import { ContractPdfService } from './pdf.service';
import {
  CreateContractDto,
  SignContractDto,
  UpdateContractDto,
  CreateAmendmentDto,
  ApproveAmendmentDto,
} from './types';
import { ApiResponse } from '../../types/common';
import { getRequestId } from '../../utils/requestId';
import { Role } from '../../config/rbac';

export class ContractController {
  private service: ContractService;
  private pdfService: ContractPdfService;

  constructor() {
    this.service = new ContractService();
    this.pdfService = new ContractPdfService();
  }

  /**
   * Create a new contract
   * POST /api/contracts
   */
  createContract = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data: CreateContractDto = req.body;
      const contract = await this.service.createContract(
        req.user.companyId,
        data
      );

      const response: ApiResponse = {
        success: true,
        data: contract,
        requestId: getRequestId(req),
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get contract by ID
   * GET /api/contracts/:id
   * User can view contract if their company is the buyer or one of the parties
   */
  getContractById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const requesterCompanyId = req.user.companyId;
      const requesterRole = req.user.role as Role;
      
      const contract = await this.service.getContractById(
        id,
        requesterCompanyId,
        requesterRole
      );

      const response: ApiResponse = {
        success: true,
        data: contract,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get contracts
   * GET /api/contracts
   * Query parameters: search, status, dateFrom, dateTo, minAmount, maxAmount, sortBy, sortOrder, page, limit
   */
  getContracts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      // Parse query parameters
      const {
        search,
        status,
        dateFrom,
        dateTo,
        minAmount,
        maxAmount,
        sortBy,
        sortOrder,
        page,
        limit,
      } = req.query;

      // Build filters object
      const filters: any = {};

      if (search) filters.search = search as string;
      if (status) filters.status = status as string;
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);
      if (minAmount) filters.minAmount = parseFloat(minAmount as string);
      if (maxAmount) filters.maxAmount = parseFloat(maxAmount as string);
      if (sortBy) filters.sortBy = sortBy as string;
      if (sortOrder) filters.sortOrder = sortOrder as 'asc' | 'desc';
      if (page) filters.page = parseInt(page as string, 10);
      if (limit) filters.limit = parseInt(limit as string, 10);

      // Use enhanced filtering if any filters are provided, otherwise use simple method
      const hasFilters =
        search ||
        dateFrom ||
        dateTo ||
        minAmount ||
        maxAmount ||
        sortBy ||
        sortOrder ||
        page ||
        limit;

      if (hasFilters) {
        const result = await this.service.getContractsWithFilters(
          req.user.companyId,
          filters
        );

        const response: ApiResponse = {
          success: true,
          data: {
            contracts: result.data,
            pagination: result.pagination,
          },
          requestId: getRequestId(req),
        };

        res.status(200).json(response);
      } else {
        // Backward compatibility: use simple method if no filters
        const contracts = await this.service.getContractsByCompany(
          req.user.companyId,
          { status: status as string }
        );

        const response: ApiResponse = {
          success: true,
          data: contracts,
          requestId: getRequestId(req),
        };

        res.status(200).json(response);
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Sign contract
   * POST /api/contracts/:id/sign
   */
  signContract = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const data: SignContractDto = req.body;
      const contract = await this.service.signContract(
        id,
        req.user.userId,
        req.user.companyId,
        data
      );

      const response: ApiResponse = {
        success: true,
        data: contract,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verify contract signature
   * POST /api/contracts/:id/verify-signature
   */
  verifySignature = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const { signatureId } = req.body;

      const result = await this.service.verifySignature(
        id,
        signatureId,
        req.user.companyId,
        req.user.role as Role
      );

      const response: ApiResponse = {
        success: true,
        data: result,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Activate contract
   * POST /api/contracts/:id/activate
   */
  activateContract = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const contract = await this.service.activateContract(id);

      const response: ApiResponse = {
        success: true,
        data: contract,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update contract
   * PATCH /api/contracts/:id
   */
  updateContract = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const data: UpdateContractDto = req.body;
      const contract = await this.service.updateContract(id, data);

      const response: ApiResponse = {
        success: true,
        data: contract,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete contract
   * DELETE /api/contracts/:id
   */
  deleteContract = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.deleteContract(id);

      const response: ApiResponse = {
        success: true,
        data: { message: 'Contract deleted successfully' },
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get contract PDF
   * GET /api/contracts/:id/pdf
   */
  getContractPdf = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const requesterCompanyId = req.user.companyId;
      const requesterRole = req.user.role as Role;
      
      // Verify contract exists and user has access (buyer OR party)
      const contract = await this.service.getContractById(
        id,
        requesterCompanyId,
        requesterRole
      );

      // Generate PDF
      const pdfBuffer = await this.pdfService.generatePdf(id);

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="contract-${id}.pdf"`
      );
      res.setHeader('Content-Length', pdfBuffer.length.toString());

      // Send PDF
      res.status(200).send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create contract amendment
   * POST /api/contracts/:id/amendments
   */
  createAmendment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const data: CreateAmendmentDto = req.body;
      const amendment = await this.service.createAmendment(
        id,
        req.user.userId,
        req.user.companyId,
        data
      );

      const response: ApiResponse = {
        success: true,
        data: amendment,
        requestId: getRequestId(req),
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get contract amendments
   * GET /api/contracts/:id/amendments
   */
  getContractAmendments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const { status } = req.query;
      const requesterCompanyId = req.user.companyId;
      const requesterRole = req.user.role as Role;
      
      const amendments = await this.service.getContractAmendments(
        id,
        { status: status as string },
        requesterCompanyId,
        requesterRole
      );

      const response: ApiResponse = {
        success: true,
        data: amendments,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get amendment by ID
   * GET /api/contracts/:id/amendments/:amendmentId
   */
  getAmendmentById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { amendmentId } = req.params;
      const requesterCompanyId = req.user.companyId;
      const requesterRole = req.user.role as Role;
      
      const amendment = await this.service.getAmendmentById(
        amendmentId,
        requesterCompanyId,
        requesterRole
      );

      const response: ApiResponse = {
        success: true,
        data: amendment,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Approve or reject amendment
   * POST /api/contracts/:id/amendments/:amendmentId/approve
   */
  approveAmendment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { amendmentId } = req.params;
      const data: ApproveAmendmentDto = req.body;
      const amendment = await this.service.approveAmendment(
        amendmentId,
        req.user.userId,
        req.user.companyId,
        data
      );

      const response: ApiResponse = {
        success: true,
        data: amendment,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get version history for a contract
   * GET /api/contracts/:id/versions
   */
  getVersionHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const requesterCompanyId = req.user.companyId;
      const requesterRole = req.user.role as Role;

      const versions = await this.service.getVersionHistory(
        id,
        requesterCompanyId,
        requesterRole
      );

      const response: ApiResponse = {
        success: true,
        data: versions,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a specific version of a contract
   * GET /api/contracts/:id/versions/:version
   */
  getContractVersion = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id, version } = req.params;
      const versionNumber = parseInt(version, 10);
      
      if (isNaN(versionNumber)) {
        res.status(400).json({
          success: false,
          error: 'Invalid version number',
          requestId: getRequestId(req),
        });
        return;
      }

      const requesterCompanyId = req.user.companyId;
      const requesterRole = req.user.role as Role;

      const contractVersion = await this.service.getContractVersion(
        id,
        versionNumber,
        requesterCompanyId,
        requesterRole
      );

      const response: ApiResponse = {
        success: true,
        data: contractVersion,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Compare two versions of a contract
   * GET /api/contracts/:id/versions/compare?version1=1&version2=2
   */
  compareVersions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const { version1, version2 } = req.query;

      const v1 = version1 ? parseInt(version1 as string, 10) : null;
      const v2 = version2 ? parseInt(version2 as string, 10) : null;

      if (!v1 || !v2 || isNaN(v1) || isNaN(v2)) {
        res.status(400).json({
          success: false,
          error: 'Both version1 and version2 query parameters are required and must be valid numbers',
          requestId: getRequestId(req),
        });
        return;
      }

      const requesterCompanyId = req.user.companyId;
      const requesterRole = req.user.role as Role;

      const diff = await this.service.compareVersions(
        id,
        v1,
        v2,
        requesterCompanyId,
        requesterRole
      );

      const response: ApiResponse = {
        success: true,
        data: diff,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
