import { PaymentRepository } from './repository';
import {
  CreatePaymentDto,
  ProcessPaymentDto,
  UpdatePaymentDto,
  PaymentResponse,
} from './types';
import { AppError } from '../../middlewares/error.middleware';
import { IPayment, PaymentStatus } from './schema';
import { ContractRepository } from '../contracts/repository';
import mongoose from 'mongoose';

export class PaymentService {
  private repository: PaymentRepository;
  private contractRepository: ContractRepository;

  constructor() {
    this.repository = new PaymentRepository();
    this.contractRepository = new ContractRepository();
  }

  /**
   * Create a new payment
   */
  async createPayment(
    companyId: string,
    data: CreatePaymentDto
  ): Promise<PaymentResponse> {
    // Verify contract exists
    const contract = await this.contractRepository.findById(data.contractId);
    if (!contract) {
      throw new AppError('Contract not found', 404);
    }

    // Create payment
    const payment = await this.repository.create({
      ...data,
      companyId,
      contractId: new mongoose.Types.ObjectId(data.contractId),
      recipientCompanyId: new mongoose.Types.ObjectId(data.recipientCompanyId),
      dueDate: new Date(data.dueDate),
      status: PaymentStatus.PENDING,
    });

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
   * Process payment
   */
  async processPayment(
    id: string,
    data: ProcessPaymentDto
  ): Promise<PaymentResponse> {
    const payment = await this.repository.findById(id);
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new AppError('Payment cannot be processed in current status', 400);
    }

    const updated = await this.repository.update(id, {
      status: PaymentStatus.PROCESSING,
      paymentMethod: data.paymentMethod,
      transactionId: data.transactionId,
      notes: data.notes,
    });

    if (!updated) {
      throw new AppError('Failed to process payment', 500);
    }

    // Simulate payment processing (in real implementation, integrate with payment gateway)
    // After successful processing, update to completed
    setTimeout(async () => {
      await this.repository.update(id, {
        status: PaymentStatus.COMPLETED,
        paidDate: new Date(),
      });
    }, 1000);

    return this.toPaymentResponse(updated);
  }

  /**
   * Update payment
   */
  async updatePayment(id: string, data: UpdatePaymentDto): Promise<PaymentResponse> {
    const payment = await this.repository.findById(id);
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    const updateData: Partial<IPayment> = { ...data };
    if (data.paidDate) {
      updateData.paidDate = new Date(data.paidDate);
    }

    const updated = await this.repository.update(id, updateData);
    if (!updated) {
      throw new AppError('Failed to update payment', 500);
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
   * Convert IPayment to PaymentResponse
   */
  private toPaymentResponse(payment: IPayment): PaymentResponse {
    return {
      id: payment._id.toString(),
      contractId: payment.contractId.toString(),
      companyId: payment.companyId.toString(),
      recipientCompanyId: payment.recipientCompanyId.toString(),
      milestone: payment.milestone,
      amount: payment.amount,
      currency: payment.currency,
      dueDate: payment.dueDate,
      paidDate: payment.paidDate,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      notes: payment.notes,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
