import { PaymentRepository } from './repository';
import {
  CreatePaymentDto,
  ProcessPaymentDto,
  UpdatePaymentDto,
  ApprovePaymentDto,
  RejectPaymentDto,
  PaymentResponse,
} from './types';
import { AppError } from '../../middlewares/error.middleware';
import { IPayment, PaymentStatus } from './schema';
import { ContractRepository } from '../contracts/repository';
import { Role } from '../../config/rbac';
import mongoose from 'mongoose';
import { getSocketService } from '../../socket/socket.service';
import { SocketEvent } from '../../socket/types';
import { logger } from '../../utils/logger';
import { PaymentGatewayFactory } from './gateways/factory';
import { PaymentGateway } from './gateways/types';
import { PaginatedResponse } from '../../types/common';
import { parsePaginationQuery, createPaginationResult, buildSortObject } from '../../utils/pagination';
import { notificationService } from '../notifications/notification.service';
import { NotificationEvent } from '../notifications/types';
import { notificationHelpers } from '../notifications/helpers';

export class PaymentService {
  private repository: PaymentRepository;
  private contractRepository: ContractRepository;

  constructor() {
    this.repository = new PaymentRepository();
    this.contractRepository = new ContractRepository();
  }

  /**
   * Create a new payment
   * Payment starts with PENDING_APPROVAL status, requires buyer approval
   */
  async createPayment(
    companyId: string,
    buyerId: string,
    data: CreatePaymentDto
  ): Promise<PaymentResponse> {
    // Verify contract exists
    const contract = await this.contractRepository.findById(data.contractId);
    if (!contract) {
      throw new AppError('Contract not found', 404);
    }

    // Verify buyer company matches contract buyer
    if (contract.buyerCompanyId.toString() !== companyId) {
      throw new AppError('Payment can only be created by the buyer company', 403);
    }

    // Verify recipient is a party to the contract
    const isRecipientParty = contract.parties.some(
      (party) => party.companyId.toString() === data.recipientCompanyId
    );
    if (!isRecipientParty) {
      throw new AppError('Recipient company must be a party to the contract', 400);
    }

    // Calculate VAT (UAE 5% default)
    const vatRate = data.vatRate ?? 0.05; // UAE VAT rate 5%
    const vatAmount = Math.round((data.amount * vatRate) * 100) / 100; // Round to 2 decimal places
    const totalAmount = data.amount + vatAmount;

    // Create payment with PENDING_APPROVAL status
    const payment = await this.repository.create({
      ...data,
      companyId,
      buyerId: new mongoose.Types.ObjectId(buyerId),
      contractId: new mongoose.Types.ObjectId(data.contractId),
      recipientCompanyId: new mongoose.Types.ObjectId(data.recipientCompanyId),
      dueDate: new Date(data.dueDate),
      status: PaymentStatus.PENDING_APPROVAL,
      vatAmount,
      vatRate,
      totalAmount,
    });

    // Emit socket event for payment creation
    try {
      const socketService = getSocketService();
      socketService.emitPaymentEvent(
        SocketEvent.PAYMENT_CREATED,
        {
          paymentId: payment._id.toString(),
          contractId: payment.contractId.toString(),
          companyId: payment.companyId.toString(),
          recipientCompanyId: payment.recipientCompanyId.toString(),
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          milestone: payment.milestone,
          dueDate: payment.dueDate,
        },
        [
          payment.companyId.toString(), // Buyer company
          payment.recipientCompanyId.toString(), // Recipient company
        ]
      );
    } catch (error) {
      logger.error('Failed to emit payment created socket event:', error);
    }

    // Notify company managers about payment creation
    try {
      const contract = await this.contractRepository.findById(payment.contractId.toString());
      const paymentUrl = `${config.frontend.url}/payments/${payment._id}`;

      // Notify buyer company managers
      await notificationService.notifyCompanyManagers(
        payment.companyId.toString(),
        NotificationEvent.PAYMENT_CREATED,
        {
          title: `New Payment Created`,
          message: `A new payment has been created for milestone "${payment.milestone}". Amount: ${payment.currency} ${payment.totalAmount.toLocaleString()} (including VAT: ${payment.currency} ${payment.vatAmount.toLocaleString()})`,
          entityType: 'payment',
          entityId: payment._id.toString(),
          actionUrl: paymentUrl,
          paymentId: payment._id.toString(),
          contractId: payment.contractId.toString(),
          amount: `${payment.currency} ${payment.amount.toLocaleString()}`,
          totalAmount: `${payment.currency} ${payment.totalAmount.toLocaleString()}`,
          milestone: payment.milestone,
          dueDate: payment.dueDate.toLocaleDateString(),
        }
      );

      // Notify recipient company managers
      await notificationService.notifyCompanyManagers(
        payment.recipientCompanyId.toString(),
        NotificationEvent.PAYMENT_CREATED,
        {
          title: `New Payment Pending Approval`,
          message: `A new payment has been created for milestone "${payment.milestone}" and is pending your approval. Amount: ${payment.currency} ${payment.totalAmount.toLocaleString()}`,
          entityType: 'payment',
          entityId: payment._id.toString(),
          actionUrl: paymentUrl,
          paymentId: payment._id.toString(),
          contractId: payment.contractId.toString(),
          amount: `${payment.currency} ${payment.amount.toLocaleString()}`,
          totalAmount: `${payment.currency} ${payment.totalAmount.toLocaleString()}`,
          milestone: payment.milestone,
          dueDate: payment.dueDate.toLocaleDateString(),
        }
      );
    } catch (error) {
      logger.error('Failed to notify company managers about payment creation:', error);
    }

    return this.toPaymentResponse(payment);
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id: string): Promise<PaymentResponse> {
    const payment = await this.repository.findById(id);
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }
    return this.toPaymentResponse(payment);
  }

  /**
   * Get payments by contract
   */
  async getPaymentsByContract(contractId: string): Promise<PaymentResponse[]> {
    const payments = await this.repository.findByContractId(contractId);
    return payments.map((payment) => this.toPaymentResponse(payment));
  }

  /**
   * Get payments by company
   */
  async getPaymentsByCompany(
    companyId: string,
    filters?: { status?: string; recipientCompanyId?: string }
  ): Promise<PaymentResponse[]> {
    const payments = await this.repository.findByCompanyId(companyId, filters as any);
    return payments.map((payment) => this.toPaymentResponse(payment));
  }

  /**
   * Get payments by company with pagination
   */
  async getPaymentsByCompanyPaginated(
    companyId: string,
    filters?: { status?: string; recipientCompanyId?: string },
    paginationQuery?: { page?: string; limit?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<PaginatedResponse<PaymentResponse>> {
    const pagination = parsePaginationQuery(paginationQuery || {});
    const sort = buildSortObject(pagination.sortBy || 'dueDate', pagination.sortOrder);

    const { payments, total } = await this.repository.findByCompanyIdPaginated(
      companyId,
      filters as any,
      {
        skip: pagination.skip,
        limit: pagination.limit,
        sortBy: Object.keys(sort)[0],
        sortOrder: Object.values(sort)[0] === 1 ? 'asc' : 'desc',
      }
    );

    return createPaginationResult(
      payments.map((payment) => this.toPaymentResponse(payment)),
      total,
      pagination
    );
  }

  /**
   * Approve payment (Buyer only)
   * Status: PENDING_APPROVAL → APPROVED
   */
  async approvePayment(
    id: string,
    buyerId: string,
    data: ApprovePaymentDto
  ): Promise<PaymentResponse> {
    const payment = await this.repository.findById(id);
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    // Verify payment belongs to buyer
    if (payment.buyerId.toString() !== buyerId) {
      throw new AppError('Only the buyer can approve this payment', 403);
    }

    // Status lifecycle: Only PENDING_APPROVAL can be approved
    if (payment.status !== PaymentStatus.PENDING_APPROVAL) {
      throw new AppError(
        `Payment cannot be approved in current status: ${payment.status}. Only pending_approval payments can be approved.`,
        400
      );
    }

    const updated = await this.repository.update(id, {
      status: PaymentStatus.APPROVED,
      approvedAt: new Date(),
      approvedBy: new mongoose.Types.ObjectId(buyerId),
      notes: data.notes,
    });

    if (!updated) {
      throw new AppError('Failed to approve payment', 500);
    }

    // Emit socket event for payment approval
    try {
      const socketService = getSocketService();
      const contract = await this.contractRepository.findById(updated.contractId.toString());
      
      if (contract) {
        const companyIds = [
          updated.companyId.toString(), // Buyer company
          updated.recipientCompanyId.toString(), // Recipient company
        ];
        
        socketService.emitPaymentEvent(
          SocketEvent.PAYMENT_APPROVED,
          {
            paymentId: updated._id.toString(),
            contractId: updated.contractId.toString(),
            companyId: updated.companyId.toString(),
            recipientCompanyId: updated.recipientCompanyId.toString(),
            amount: updated.amount,
            currency: updated.currency,
            status: updated.status,
            milestone: updated.milestone,
            approvedBy: buyerId,
            notes: data.notes,
          },
          companyIds
        );
      }
    } catch (error) {
      logger.error('Failed to emit payment approved socket event:', error);
    }

    // Notify company managers about payment approval
    try {
      const paymentUrl = `${config.frontend.url}/payments/${updated._id}`;

      // Notify buyer company managers
      await notificationService.notifyCompanyManagers(
        updated.companyId.toString(),
        NotificationEvent.PAYMENT_APPROVED,
        {
          title: `Payment Approved`,
          message: `Payment for milestone "${updated.milestone}" has been approved. Amount: ${updated.currency} ${updated.totalAmount.toLocaleString()}`,
          entityType: 'payment',
          entityId: updated._id.toString(),
          actionUrl: paymentUrl,
          paymentId: updated._id.toString(),
          contractId: updated.contractId.toString(),
          amount: `${updated.currency} ${updated.amount.toLocaleString()}`,
          totalAmount: `${updated.currency} ${updated.totalAmount.toLocaleString()}`,
          milestone: updated.milestone,
          notes: data.notes,
        }
      );

      // Notify recipient company managers
      await notificationService.notifyCompanyManagers(
        updated.recipientCompanyId.toString(),
        NotificationEvent.PAYMENT_APPROVED,
        {
          title: `Payment Approved`,
          message: `Payment for milestone "${updated.milestone}" has been approved. Amount: ${updated.currency} ${updated.totalAmount.toLocaleString()}`,
          entityType: 'payment',
          entityId: updated._id.toString(),
          actionUrl: paymentUrl,
          paymentId: updated._id.toString(),
          contractId: updated.contractId.toString(),
          amount: `${updated.currency} ${updated.amount.toLocaleString()}`,
          totalAmount: `${updated.currency} ${updated.totalAmount.toLocaleString()}`,
          milestone: updated.milestone,
          notes: data.notes,
        }
      );
    } catch (error) {
      logger.error('Failed to notify company managers about payment approval:', error);
    }

    return this.toPaymentResponse(updated);
  }

  /**
   * Reject payment (Buyer only)
   * Status: PENDING_APPROVAL → REJECTED
   */
  async rejectPayment(
    id: string,
    buyerId: string,
    data: RejectPaymentDto
  ): Promise<PaymentResponse> {
    const payment = await this.repository.findById(id);
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    // Verify payment belongs to buyer
    if (payment.buyerId.toString() !== buyerId) {
      throw new AppError('Only the buyer can reject this payment', 403);
    }

    // Status lifecycle: Only PENDING_APPROVAL can be rejected
    if (payment.status !== PaymentStatus.PENDING_APPROVAL) {
      throw new AppError(
        `Payment cannot be rejected in current status: ${payment.status}. Only pending_approval payments can be rejected.`,
        400
      );
    }

    const updated = await this.repository.update(id, {
      status: PaymentStatus.REJECTED,
      rejectedAt: new Date(),
      rejectedBy: new mongoose.Types.ObjectId(buyerId),
      rejectionReason: data.rejectionReason,
    });

    if (!updated) {
      throw new AppError('Failed to reject payment', 500);
    }

    // Emit socket event for payment rejection
    try {
      const socketService = getSocketService();
      const contract = await this.contractRepository.findById(updated.contractId.toString());
      
      if (contract) {
        const companyIds = [
          updated.companyId.toString(), // Buyer company
          updated.recipientCompanyId.toString(), // Recipient company
        ];
        
        socketService.emitPaymentEvent(
          SocketEvent.PAYMENT_REJECTED,
          {
            paymentId: updated._id.toString(),
            contractId: updated.contractId.toString(),
            companyId: updated.companyId.toString(),
            recipientCompanyId: updated.recipientCompanyId.toString(),
            amount: updated.amount,
            currency: updated.currency,
            status: updated.status,
            milestone: updated.milestone,
            rejectedBy: buyerId,
            rejectionReason: data.rejectionReason,
          },
          companyIds
        );
      }
    } catch (error) {
      logger.error('Failed to emit payment rejected socket event:', error);
    }

    // Notify company managers about payment rejection
    try {
      const paymentUrl = `${config.frontend.url}/payments/${updated._id}`;

      // Notify buyer company managers
      await notificationService.notifyCompanyManagers(
        updated.companyId.toString(),
        NotificationEvent.PAYMENT_REJECTED,
        {
          title: `Payment Rejected`,
          message: `Payment for milestone "${updated.milestone}" has been rejected. ${data.rejectionReason ? `Reason: ${data.rejectionReason}` : ''}`,
          entityType: 'payment',
          entityId: updated._id.toString(),
          actionUrl: paymentUrl,
          paymentId: updated._id.toString(),
          contractId: updated.contractId.toString(),
          amount: `${updated.currency} ${updated.amount.toLocaleString()}`,
          totalAmount: `${updated.currency} ${updated.totalAmount.toLocaleString()}`,
          milestone: updated.milestone,
          rejectionReason: data.rejectionReason,
        }
      );

      // Notify recipient company managers
      await notificationService.notifyCompanyManagers(
        updated.recipientCompanyId.toString(),
        NotificationEvent.PAYMENT_REJECTED,
        {
          title: `Payment Rejected`,
          message: `Payment for milestone "${updated.milestone}" has been rejected. ${data.rejectionReason ? `Reason: ${data.rejectionReason}` : ''}`,
          entityType: 'payment',
          entityId: updated._id.toString(),
          actionUrl: paymentUrl,
          paymentId: updated._id.toString(),
          contractId: updated.contractId.toString(),
          amount: `${updated.currency} ${updated.amount.toLocaleString()}`,
          totalAmount: `${updated.currency} ${updated.totalAmount.toLocaleString()}`,
          milestone: updated.milestone,
          rejectionReason: data.rejectionReason,
        }
      );
    } catch (error) {
      logger.error('Failed to notify company managers about payment rejection:', error);
    }

    return this.toPaymentResponse(updated);
  }

  /**
   * Process payment
   * Status: APPROVED → PROCESSING → COMPLETED/FAILED
   */
  async processPayment(
    id: string,
    data: ProcessPaymentDto
  ): Promise<PaymentResponse> {
    const payment = await this.repository.findById(id);
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    // Status lifecycle: Only APPROVED payments can be processed
    if (payment.status !== PaymentStatus.APPROVED) {
      throw new AppError(
        `Payment cannot be processed in current status: ${payment.status}. Only approved payments can be processed.`,
        400
      );
    }

    try {
      // Get the appropriate payment gateway
      const gateway = PaymentGatewayFactory.getGateway(data.gateway === 'stripe' ? PaymentGateway.STRIPE : PaymentGateway.PAYPAL);

      // Create payment intent/order with the gateway
      const paymentIntent = await gateway.createPaymentIntent({
        amount: payment.amount,
        currency: payment.currency,
        paymentId: payment._id.toString(),
        description: `Payment for ${payment.milestone} - Contract ${payment.contractId}`,
        metadata: {
          contractId: payment.contractId.toString(),
          milestone: payment.milestone,
        },
      });

      // Update payment with gateway information
      const updateData: Partial<IPayment> = {
        status: PaymentStatus.PROCESSING,
        paymentMethod: data.paymentMethod,
        gateway: data.gateway,
        gatewayIntentId: paymentIntent.id,
        notes: data.notes,
      };

      // Add gateway-specific fields
      if (paymentIntent.clientSecret) {
        updateData.gatewayClientSecret = paymentIntent.clientSecret;
      }
      if (paymentIntent.redirectUrl) {
        updateData.gatewayRedirectUrl = paymentIntent.redirectUrl;
      }

      const updated = await this.repository.update(id, updateData);

      if (!updated) {
        throw new AppError('Failed to process payment', 500);
      }

      // Emit socket event for payment processing
      try {
        const socketService = getSocketService();
        const contract = await this.contractRepository.findById(updated.contractId.toString());
        
        if (contract) {
          const companyIds = [
            updated.companyId.toString(), // Buyer company
            updated.recipientCompanyId.toString(), // Recipient company
          ];
          
          socketService.emitPaymentEvent(
            SocketEvent.PAYMENT_PROCESSED,
            {
              paymentId: updated._id.toString(),
              contractId: updated.contractId.toString(),
              companyId: updated.companyId.toString(),
              recipientCompanyId: updated.recipientCompanyId.toString(),
              amount: updated.amount,
              currency: updated.currency,
              status: PaymentStatus.PROCESSING,
              milestone: updated.milestone,
              paymentMethod: data.paymentMethod,
              gateway: data.gateway,
              gatewayIntentId: paymentIntent.id,
              gatewayClientSecret: paymentIntent.clientSecret,
              gatewayRedirectUrl: paymentIntent.redirectUrl,
            },
            companyIds
          );
        }
      } catch (error) {
        logger.error('Failed to emit payment processed socket event:', error);
      }

      return this.toPaymentResponse(updated);
    } catch (error: any) {
      logger.error('Payment gateway processing failed:', error);
      
      // Extract failure reason from error
      const failureReason = error.message || error.response?.data?.message || 'Payment gateway processing failed';
      
      // Update payment status to failed with failure reason
      await this.repository.update(id, {
        status: PaymentStatus.FAILED,
        failedAt: new Date(),
        failureReason: failureReason,
        notes: payment.notes ? `${payment.notes}\n\nPayment processing failed: ${failureReason}` : `Payment processing failed: ${failureReason}`,
      });

      // Emit socket event for payment failure
      try {
        const socketService = getSocketService();
        const contract = await this.contractRepository.findById(payment.contractId.toString());
        
        if (contract) {
          const companyIds = [
            payment.companyId.toString(),
            payment.recipientCompanyId.toString(),
          ];
          
          socketService.emitPaymentEvent(
            SocketEvent.PAYMENT_FAILED,
            {
              paymentId: payment._id.toString(),
              contractId: payment.contractId.toString(),
              companyId: payment.companyId.toString(),
              recipientCompanyId: payment.recipientCompanyId.toString(),
              amount: payment.amount,
              currency: payment.currency,
              status: PaymentStatus.FAILED,
              milestone: payment.milestone,
              failureReason: failureReason,
            },
            companyIds
          );
        }
      } catch (socketError) {
        logger.error('Failed to emit payment failure socket event:', socketError);
      }

      // Send email notifications to both parties
      try {
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        const paymentUrl = `${baseUrl}/payments/${payment._id.toString()}`;
        
        // Get recipients for buyer company
        const buyerRecipients = await notificationHelpers.getRecipientsByCompany(
          payment.companyId.toString(),
          []
        );
        
        // Get recipients for recipient company
        const recipientCompanyRecipients = await notificationHelpers.getRecipientsByCompany(
          payment.recipientCompanyId.toString(),
          []
        );
        
        // Send to buyer company
        if (buyerRecipients.length > 0) {
          await notificationService.notify({
            event: NotificationEvent.PAYMENT_FAILED,
            recipients: buyerRecipients,
            data: {
              recipientName: buyerRecipients[0]?.name || 'User',
              paymentId: payment._id.toString(),
              amount: `${payment.currency} ${payment.amount.toLocaleString()}`,
              milestone: payment.milestone,
              failureReason: failureReason,
              failedAt: new Date().toLocaleString(),
              paymentUrl: paymentUrl,
            },
          });
        }
        
        // Send to recipient company
        if (recipientCompanyRecipients.length > 0) {
          await notificationService.notify({
            event: NotificationEvent.PAYMENT_FAILED,
            recipients: recipientCompanyRecipients,
            data: {
              recipientName: recipientCompanyRecipients[0]?.name || 'User',
              paymentId: payment._id.toString(),
              amount: `${payment.currency} ${payment.amount.toLocaleString()}`,
              milestone: payment.milestone,
              failureReason: failureReason,
              failedAt: new Date().toLocaleString(),
              paymentUrl: paymentUrl,
            },
          });
        }
      } catch (notificationError) {
        logger.error('Failed to send payment failure email notifications:', notificationError);
      }

      throw new AppError(`Payment processing failed: ${failureReason}`, 500);
    }
  }

  /**
   * Update payment
   * Only allows updates to notes and paidDate
   * Status changes must go through approval/processing flow
   */
  async updatePayment(id: string, data: UpdatePaymentDto): Promise<PaymentResponse> {
    const payment = await this.repository.findById(id);
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    // Prevent direct status updates (must use approve/reject/process endpoints)
    if (data.status && data.status !== payment.status) {
      throw new AppError(
        'Status cannot be updated directly. Use approve, reject, or process endpoints.',
        400
      );
    }

    const updateData: Partial<IPayment> = {};
    if (data.paidDate) {
      updateData.paidDate = new Date(data.paidDate);
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    const updated = await this.repository.update(id, updateData);
    if (!updated) {
      throw new AppError('Failed to update payment', 500);
    }

    return this.toPaymentResponse(updated);
  }

  /**
   * Retry failed payment
   * Status: FAILED → APPROVED (ready for processing again)
   */
  async retryPayment(
    id: string,
    userId: string,
    data: { paymentMethod?: string; gateway?: 'stripe' | 'paypal'; notes?: string }
  ): Promise<PaymentResponse> {
    const payment = await this.repository.findById(id);
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    // Only failed payments can be retried
    if (payment.status !== PaymentStatus.FAILED) {
      throw new AppError(
        `Payment cannot be retried in current status: ${payment.status}. Only failed payments can be retried.`,
        400
      );
    }

    // Update payment to approved status for retry
    const updateData: Partial<IPayment> = {
      status: PaymentStatus.APPROVED,
      retryCount: (payment.retryCount || 0) + 1,
      lastRetryAt: new Date(),
    };

    // Update payment method if provided
    if (data.paymentMethod) {
      updateData.paymentMethod = data.paymentMethod;
    }
    if (data.gateway) {
      updateData.gateway = data.gateway;
    }
    if (data.notes) {
      updateData.notes = payment.notes
        ? `${payment.notes}\n\nRetry attempt ${(payment.retryCount || 0) + 1}: ${data.notes}`
        : `Retry attempt ${(payment.retryCount || 0) + 1}: ${data.notes}`;
    }

    const updated = await this.repository.update(id, updateData);
    if (!updated) {
      throw new AppError('Failed to retry payment', 500);
    }

    // Emit socket event for payment retry
    try {
      const socketService = getSocketService();
      const contract = await this.contractRepository.findById(updated.contractId.toString());
      
      if (contract) {
        const companyIds = [
          updated.companyId.toString(),
          updated.recipientCompanyId.toString(),
        ];
        
        socketService.emitPaymentEvent(
          SocketEvent.PAYMENT_RETRY,
          {
            paymentId: updated._id.toString(),
            contractId: updated.contractId.toString(),
            companyId: updated.companyId.toString(),
            recipientCompanyId: updated.recipientCompanyId.toString(),
            amount: updated.amount,
            currency: updated.currency,
            status: PaymentStatus.APPROVED,
            milestone: updated.milestone,
            retryCount: updated.retryCount,
            failureReason: payment.failureReason,
          },
          companyIds
        );
      }
    } catch (error) {
      logger.error('Failed to emit payment retry socket event:', error);
    }

    // Send email notifications for payment retry
    try {
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const paymentUrl = `${baseUrl}/payments/${updated._id.toString()}`;
      
      // Get recipients for buyer company
      const buyerRecipients = await notificationHelpers.getRecipientsByCompany(
        updated.companyId.toString(),
        []
      );
      
      // Get recipients for recipient company
      const recipientCompanyRecipients = await notificationHelpers.getRecipientsByCompany(
        updated.recipientCompanyId.toString(),
        []
      );
      
      // Send to buyer company
      if (buyerRecipients.length > 0) {
        await notificationService.notify({
          event: NotificationEvent.PAYMENT_RETRY,
          recipients: buyerRecipients,
          data: {
            recipientName: buyerRecipients[0]?.name || 'User',
            paymentId: updated._id.toString(),
            amount: `${updated.currency} ${updated.amount.toLocaleString()}`,
            milestone: updated.milestone,
            retryCount: updated.retryCount || 1,
            failureReason: payment.failureReason || 'Unknown',
            paymentUrl: paymentUrl,
          },
        });
      }
      
      // Send to recipient company
      if (recipientCompanyRecipients.length > 0) {
        await notificationService.notify({
          event: NotificationEvent.PAYMENT_RETRY,
          recipients: recipientCompanyRecipients,
          data: {
            recipientName: recipientCompanyRecipients[0]?.name || 'User',
            paymentId: updated._id.toString(),
            amount: `${updated.currency} ${updated.amount.toLocaleString()}`,
            milestone: updated.milestone,
            retryCount: updated.retryCount || 1,
            failureReason: payment.failureReason || 'Unknown',
            paymentUrl: paymentUrl,
          },
        });
      }
    } catch (notificationError) {
      logger.error('Failed to send payment retry email notifications:', notificationError);
    }

    return this.toPaymentResponse(updated);
  }

  /**
   * Update payment method for failed payment
   * Allows changing payment method before retry
   */
  async updatePaymentMethod(
    id: string,
    userId: string,
    data: { paymentMethod: string; gateway: 'stripe' | 'paypal'; notes?: string }
  ): Promise<PaymentResponse> {
    const payment = await this.repository.findById(id);
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    // Only failed or approved payments can have payment method updated
    if (payment.status !== PaymentStatus.FAILED && payment.status !== PaymentStatus.APPROVED) {
      throw new AppError(
        `Payment method cannot be updated in current status: ${payment.status}. Only failed or approved payments can have payment method updated.`,
        400
      );
    }

    const updateData: Partial<IPayment> = {
      paymentMethod: data.paymentMethod,
      gateway: data.gateway,
    };

    if (data.notes) {
      updateData.notes = payment.notes
        ? `${payment.notes}\n\nPayment method updated: ${data.notes}`
        : `Payment method updated: ${data.notes}`;
    }

    const updated = await this.repository.update(id, updateData);
    if (!updated) {
      throw new AppError('Failed to update payment method', 500);
    }

    // Emit socket event for payment method update
    try {
      const socketService = getSocketService();
      const contract = await this.contractRepository.findById(updated.contractId.toString());
      
      if (contract) {
        const companyIds = [
          updated.companyId.toString(),
          updated.recipientCompanyId.toString(),
        ];
        
        socketService.emitPaymentEvent(
          SocketEvent.PAYMENT_PROCESSED,
          {
            paymentId: updated._id.toString(),
            contractId: updated.contractId.toString(),
            companyId: updated.companyId.toString(),
            recipientCompanyId: updated.recipientCompanyId.toString(),
            amount: updated.amount,
            currency: updated.currency,
            status: updated.status,
            milestone: updated.milestone,
            paymentMethod: data.paymentMethod,
            gateway: data.gateway,
          },
          companyIds
        );
      }
    } catch (error) {
      logger.error('Failed to emit payment method update socket event:', error);
    }

    return this.toPaymentResponse(updated);
  }

  /**
   * Delete payment (soft delete)
   */
  async deletePayment(id: string): Promise<void> {
    const payment = await this.repository.findById(id);
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    await this.repository.softDelete(id);
  }

  /**
   * Handle webhook event from payment gateway
   */
  async handleWebhook(
    gateway: PaymentGateway,
    event: any,
    signature?: string
  ): Promise<void> {
    try {
      const gatewayInstance = PaymentGatewayFactory.getGateway(gateway);

      // Verify webhook signature if provided
      if (signature) {
        const secret = gateway === PaymentGateway.STRIPE
          ? process.env.STRIPE_WEBHOOK_SECRET
          : process.env.PAYPAL_WEBHOOK_SECRET;

        if (secret) {
          const payload = typeof event === 'string' ? event : JSON.stringify(event);
          const isValid = gatewayInstance.verifyWebhookSignature(
            payload,
            signature,
            secret
          );

          if (!isValid) {
            throw new AppError('Invalid webhook signature', 401);
          }
        }
      }

      // Parse webhook event
      const webhookEvent = gatewayInstance.parseWebhookEvent(event);

      // Handle gateway-specific events
      let paymentUpdate: {
        paymentId: string;
        status: 'succeeded' | 'failed' | 'canceled' | 'processing';
        transactionId: string;
      } | null = null;

      if (gateway === PaymentGateway.STRIPE) {
        const stripeGateway = gatewayInstance as any;
        paymentUpdate = stripeGateway.handleWebhookEvent(event);
      } else if (gateway === PaymentGateway.PAYPAL) {
        const paypalGateway = gatewayInstance as any;
        paymentUpdate = paypalGateway.handleWebhookEvent(event);
      }

      if (!paymentUpdate) {
        logger.info(`Ignoring webhook event: ${webhookEvent.type}`);
        return;
      }

      // Find payment by ID
      const payment = await this.repository.findById(paymentUpdate.paymentId);
      if (!payment) {
        logger.warn(`Payment not found for webhook: ${paymentUpdate.paymentId}`);
        return;
      }

      // Map gateway status to payment status
      let newStatus: PaymentStatus = payment.status;
      switch (paymentUpdate.status) {
        case 'succeeded':
          newStatus = PaymentStatus.COMPLETED;
          break;
        case 'failed':
          newStatus = PaymentStatus.FAILED;
          break;
        case 'canceled':
          newStatus = PaymentStatus.CANCELLED;
          break;
        case 'processing':
          newStatus = PaymentStatus.PROCESSING;
          break;
      }

      // Update payment status
      const updateData: Partial<IPayment> = {
        status: newStatus,
        transactionId: paymentUpdate.transactionId,
      };

      if (newStatus === PaymentStatus.COMPLETED) {
        updateData.paidDate = new Date();
      }

      if (newStatus === PaymentStatus.FAILED) {
        updateData.failedAt = new Date();
        // Extract failure reason from webhook event if available
        const failureReason = webhookEvent.failureReason || webhookEvent.error?.message || 'Payment gateway reported failure';
        updateData.failureReason = failureReason;
      }

      const updated = await this.repository.update(paymentUpdate.paymentId, updateData);

      if (updated) {
        // Emit socket event
        try {
          const socketService = getSocketService();
          const contract = await this.contractRepository.findById(updated.contractId.toString());
          
          if (contract) {
            const companyIds = [
              updated.companyId.toString(),
              updated.recipientCompanyId.toString(),
            ];
            
            const socketEvent = newStatus === PaymentStatus.COMPLETED
              ? SocketEvent.PAYMENT_COMPLETED
              : newStatus === PaymentStatus.FAILED
              ? SocketEvent.PAYMENT_FAILED
              : SocketEvent.PAYMENT_PROCESSED;

            socketService.emitPaymentEvent(
              socketEvent,
              {
                paymentId: updated._id.toString(),
                contractId: updated.contractId.toString(),
                companyId: updated.companyId.toString(),
                recipientCompanyId: updated.recipientCompanyId.toString(),
                amount: updated.amount,
                currency: updated.currency,
                status: newStatus,
                milestone: updated.milestone,
                transactionId: paymentUpdate.transactionId,
                paidDate: updated.paidDate,
              },
              companyIds
            );
          }
        } catch (error) {
          logger.error('Failed to emit payment webhook socket event:', error);
        }
      }
    } catch (error: any) {
      logger.error('Webhook handling failed:', error);
      throw error;
    }
  }

  /**
   * Convert IPayment to PaymentResponse
   */
  private toPaymentResponse(payment: IPayment): PaymentResponse {
    return {
      id: payment._id.toString(),
      contractId: payment.contractId.toString(),
      companyId: payment.companyId.toString(),
      recipientCompanyId: payment.recipientCompanyId.toString(),
      buyerId: payment.buyerId.toString(),
      milestone: payment.milestone,
      amount: payment.amount,
      vatAmount: payment.vatAmount,
      vatRate: payment.vatRate,
      totalAmount: payment.totalAmount,
      currency: payment.currency,
      dueDate: payment.dueDate,
      paidDate: payment.paidDate,
      status: payment.status,
      approvedAt: payment.approvedAt,
      approvedBy: payment.approvedBy?.toString(),
      rejectedAt: payment.rejectedAt,
      rejectedBy: payment.rejectedBy?.toString(),
      rejectionReason: payment.rejectionReason,
      failedAt: payment.failedAt,
      failureReason: payment.failureReason,
      retryCount: payment.retryCount,
      lastRetryAt: payment.lastRetryAt,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      gateway: payment.gateway,
      gatewayIntentId: payment.gatewayIntentId,
      gatewayClientSecret: payment.gatewayClientSecret,
      gatewayRedirectUrl: payment.gatewayRedirectUrl,
      notes: payment.notes,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
