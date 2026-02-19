import { Request, Response, NextFunction } from 'express';
import { ContractService } from './service';
import { CreateContractDto, SignContractDto, UpdateContractDto } from './types';
import { ApiResponse } from '../../types/common';
import { getRequestId } from '../../utils/requestId';

export class ContractController {
  private service: ContractService;

  constructor() {
    this.service = new ContractService();
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
   */
  getContractById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const contract = await this.service.getContractById(id);

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

      const { status } = req.query;
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
}
