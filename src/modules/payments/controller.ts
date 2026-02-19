import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './service';
import { CreatePaymentDto, ProcessPaymentDto, UpdatePaymentDto } from './types';
import { ApiResponse } from '../../types/common';
import { getRequestId } from '../../utils/requestId';

export class PaymentController {
  private service: PaymentService;

  constructor() {
    this.service = new PaymentService();
  }

  /**
   * Create a new payment
   * POST /api/payments
   */
  createPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const data: CreatePaymentDto = req.body;
      const payment = await this.service.createPayment(
        req.user.companyId,
        data
      );

      const response: ApiResponse = {
        success: true,
        data: payment,
        requestId: getRequestId(req),
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get payment by ID
   * GET /api/payments/:id
   */
  getPaymentById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const payment = await this.service.getPaymentById(id);

      const response: ApiResponse = {
        success: true,
        data: payment,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get payments
   * GET /api/payments
   */
  getPayments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { status, recipientCompanyId } = req.query;
      const payments = await this.service.getPaymentsByCompany(
        req.user.companyId,
        { status: status as string, recipientCompanyId: recipientCompanyId as string }
      );

      const response: ApiResponse = {
        success: true,
        data: payments,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Process payment
   * POST /api/payments/:id/process
   */
  processPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const data: ProcessPaymentDto = req.body;
      const payment = await this.service.processPayment(id, data);

      const response: ApiResponse = {
        success: true,
        data: payment,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update payment
   * PATCH /api/payments/:id
   */
  updatePayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const data: UpdatePaymentDto = req.body;
      const payment = await this.service.updatePayment(id, data);

      const response: ApiResponse = {
        success: true,
        data: payment,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete payment
   * DELETE /api/payments/:id
   */
  deletePayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.deletePayment(id);

      const response: ApiResponse = {
        success: true,
        data: { message: 'Payment deleted successfully' },
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
