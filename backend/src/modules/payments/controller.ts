import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './service';
import {
  CreatePaymentDto,
  ProcessPaymentDto,
  UpdatePaymentDto,
  ApprovePaymentDto,
  RejectPaymentDto,
  PaymentResponse,
} from './types';
import { ApiResponse, PaginatedResponse } from '../../types/common';
import { getRequestId } from '../../utils/requestId';
import { PaymentGateway } from './gateways/types';
import { logger } from '../../utils/logger';
import { createAuditLog } from '../../middlewares/audit.middleware';
import { AuditAction, AuditResource } from '../audit/schema';
import { RetryPaymentDto, UpdatePaymentMethodDto } from './types';

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
        req.user.userId,
        data
      );

      // Audit log
      await createAuditLog(
        req.user.userId,
        req.user.companyId,
        AuditAction.CREATE,
        AuditResource.PAYMENT,
        {
          resourceId: payment.id,
          after: {
            milestone: payment.milestone,
            amount: payment.amount,
            totalAmount: payment.totalAmount,
            currency: payment.currency,
            status: payment.status,
            contractId: payment.contractId,
            recipientCompanyId: payment.recipientCompanyId,
          },
          changes: { action: 'create_payment' },
        },
        'success'
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
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const payment = await this.service.getPaymentById(id);

      // Audit log for viewing payment
      await createAuditLog(
        req.user.userId,
        req.user.companyId,
        AuditAction.VIEW,
        AuditResource.PAYMENT,
        {
          resourceId: id,
          changes: { action: 'view_payment' },
        },
        'success'
      );

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
   * Supports pagination: ?page=1&limit=20&sortBy=dueDate&sortOrder=asc
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

      const { status, recipientCompanyId, contractId, page, limit, sortBy, sortOrder } = req.query;
      
      // If contractId is provided, get payments by contract
      if (contractId) {
        const payments = await this.service.getPaymentsByContract(contractId as string);
        const response: ApiResponse = {
          success: true,
          data: payments,
          requestId: getRequestId(req),
        };
        res.status(200).json(response);
        return;
      }
      
      if (page || limit) {
        const result = await this.service.getPaymentsByCompanyPaginated(
          req.user.companyId,
          { status: status as string, recipientCompanyId: recipientCompanyId as string },
          { page: page as string, limit: limit as string, sortBy: sortBy as string, sortOrder: sortOrder as 'asc' | 'desc' }
        );

        const response: ApiResponse<PaginatedResponse<PaymentResponse>> = {
          success: true,
          data: result,
          requestId: getRequestId(req),
        };

        res.status(200).json(response);
      } else {
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
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Approve payment (Buyer only)
   * POST /api/payments/:id/approve
   */
  approvePayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const data: ApprovePaymentDto = req.body;
      
      // Get payment before approval for audit log
      const paymentBefore = await this.service.getPaymentById(id);
      
      const payment = await this.service.approvePayment(id, req.user.userId, data);

      // Audit log
      await createAuditLog(
        req.user.userId,
        req.user.companyId,
        AuditAction.UPDATE,
        AuditResource.PAYMENT,
        {
          resourceId: id,
          before: { status: paymentBefore?.data?.status },
          after: { status: payment.status, approvedAt: payment.approvedAt },
          changes: { action: 'approve_payment', notes: data.notes },
        },
        'success'
      );

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
   * Reject payment (Buyer only)
   * POST /api/payments/:id/reject
   */
  rejectPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const data: RejectPaymentDto = req.body;
      
      // Get payment before rejection for audit log
      const paymentBefore = await this.service.getPaymentById(id);
      
      const payment = await this.service.rejectPayment(id, req.user.userId, data);

      // Audit log
      await createAuditLog(
        req.user.userId,
        req.user.companyId,
        AuditAction.UPDATE,
        AuditResource.PAYMENT,
        {
          resourceId: id,
          before: { status: paymentBefore?.data?.status },
          after: { status: payment.status, rejectedAt: payment.rejectedAt, rejectionReason: payment.rejectionReason },
          changes: { action: 'reject_payment', rejectionReason: data.rejectionReason },
        },
        'success'
      );

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
   * Process payment
   * POST /api/payments/:id/process
   */
  processPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const data: ProcessPaymentDto = req.body;
      
      // Get payment before processing for audit log
      const paymentBefore = await this.service.getPaymentById(id);
      
      const payment = await this.service.processPayment(id, data);

      // Audit log
      await createAuditLog(
        req.user.userId,
        req.user.companyId,
        AuditAction.UPDATE,
        AuditResource.PAYMENT,
        {
          resourceId: id,
          before: { status: paymentBefore?.data?.status },
          after: { status: payment.status, paymentMethod: payment.paymentMethod, gateway: payment.gateway },
          changes: { action: 'process_payment', paymentMethod: data.paymentMethod, gateway: data.gateway },
        },
        'success'
      );

      const response: ApiResponse = {
        success: true,
        data: payment,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      if (req.user) {
        await createAuditLog(
          req.user.userId,
          req.user.companyId,
          AuditAction.UPDATE,
          AuditResource.PAYMENT,
          {
            resourceId: req.params.id,
            changes: { action: 'process_payment' },
          },
          'failure',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
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
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const data: UpdatePaymentDto = req.body;
      
      // Get payment before update for audit log
      const paymentBefore = await this.service.getPaymentById(id);
      
      const payment = await this.service.updatePayment(id, data);

      // Audit log
      await createAuditLog(
        req.user.userId,
        req.user.companyId,
        AuditAction.UPDATE,
        AuditResource.PAYMENT,
        {
          resourceId: id,
          before: {
            paidDate: paymentBefore?.data?.paidDate,
            notes: paymentBefore?.data?.notes,
          },
          after: {
            paidDate: payment.paidDate,
            notes: payment.notes,
          },
          changes: { action: 'update_payment', ...data },
        },
        'success'
      );

      const response: ApiResponse = {
        success: true,
        data: payment,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      if (req.user) {
        await createAuditLog(
          req.user.userId,
          req.user.companyId,
          AuditAction.UPDATE,
          AuditResource.PAYMENT,
          {
            resourceId: req.params.id,
            changes: { action: 'update_payment' },
          },
          'failure',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
      next(error);
    }
  };

  /**
   * Retry failed payment
   * POST /api/payments/:id/retry
   */
  retryPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const data: RetryPaymentDto = req.body;
      
      // Get payment before retry for audit log
      const paymentBefore = await this.service.getPaymentById(id);
      
      const payment = await this.service.retryPayment(id, req.user.userId, data);

      // Audit log
      await createAuditLog(
        req.user.userId,
        req.user.companyId,
        AuditAction.UPDATE,
        AuditResource.PAYMENT,
        {
          resourceId: id,
          before: { status: paymentBefore?.data?.status },
          after: { status: payment.status, retryCount: payment.retryCount },
          changes: { action: 'retry_payment', retryCount: payment.retryCount },
        },
        'success'
      );

      const response: ApiResponse = {
        success: true,
        data: payment,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      if (req.user) {
        await createAuditLog(
          req.user.userId,
          req.user.companyId,
          AuditAction.UPDATE,
          AuditResource.PAYMENT,
          {
            resourceId: req.params.id,
            changes: { action: 'retry_payment' },
          },
          'failure',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
      next(error);
    }
  };

  /**
   * Update payment method
   * PATCH /api/payments/:id/payment-method
   */
  updatePaymentMethod = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const data: UpdatePaymentMethodDto = req.body;
      
      // Get payment before update for audit log
      const paymentBefore = await this.service.getPaymentById(id);
      
      const payment = await this.service.updatePaymentMethod(id, req.user.userId, data);

      // Audit log
      await createAuditLog(
        req.user.userId,
        req.user.companyId,
        AuditAction.UPDATE,
        AuditResource.PAYMENT,
        {
          resourceId: id,
          before: { paymentMethod: paymentBefore?.data?.paymentMethod, gateway: paymentBefore?.data?.gateway },
          after: { paymentMethod: payment.paymentMethod, gateway: payment.gateway },
          changes: { action: 'update_payment_method', paymentMethod: data.paymentMethod, gateway: data.gateway },
        },
        'success'
      );

      const response: ApiResponse = {
        success: true,
        data: payment,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      if (req.user) {
        await createAuditLog(
          req.user.userId,
          req.user.companyId,
          AuditAction.UPDATE,
          AuditResource.PAYMENT,
          {
            resourceId: req.params.id,
            changes: { action: 'update_payment_method' },
          },
          'failure',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
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
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      
      // Get payment before deletion for audit log
      const paymentBefore = await this.service.getPaymentById(id);
      
      await this.service.deletePayment(id);

      // Audit log
      await createAuditLog(
        req.user.userId,
        req.user.companyId,
        AuditAction.DELETE,
        AuditResource.PAYMENT,
        {
          resourceId: id,
          before: {
            milestone: paymentBefore?.data?.milestone,
            amount: paymentBefore?.data?.amount,
            status: paymentBefore?.data?.status,
          },
          changes: { action: 'delete_payment' },
        },
        'success'
      );

      const response: ApiResponse = {
        success: true,
        data: { message: 'Payment deleted successfully' },
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      if (req.user) {
        await createAuditLog(
          req.user.userId,
          req.user.companyId,
          AuditAction.DELETE,
          AuditResource.PAYMENT,
          {
            resourceId: req.params.id,
            changes: { action: 'delete_payment' },
          },
          'failure',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
      next(error);
    }
  };

  /**
   * Handle Stripe webhook
   * POST /api/payments/webhooks/stripe
   */
  handleStripeWebhook = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const signature = (req as any).webhookSignature || req.headers['stripe-signature'] as string;
      // Use raw body if available, otherwise parsed body
      const rawBody = (req as any).rawBody;
      const event = rawBody ? JSON.parse(rawBody) : req.body;

      await this.service.handleWebhook(PaymentGateway.STRIPE, event, signature);

      // Stripe expects 200 response
      res.status(200).json({ received: true });
    } catch (error) {
      // Log error but return 200 to Stripe (they'll retry)
      logger.error('Stripe webhook error:', error);
      res.status(200).json({ received: false, error: 'Webhook processing failed' });
    }
  };

  /**
   * Handle PayPal webhook
   * POST /api/payments/webhooks/paypal
   */
  handlePayPalWebhook = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const signature = (req as any).webhookSignature || req.headers['paypal-transmission-sig'] as string;
      // Use raw body if available, otherwise parsed body
      const rawBody = (req as any).rawBody;
      const event = rawBody ? JSON.parse(rawBody) : req.body;

      await this.service.handleWebhook(PaymentGateway.PAYPAL, event, signature);

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('PayPal webhook error:', error);
      res.status(200).json({ received: false, error: 'Webhook processing failed' });
    }
  };
}
