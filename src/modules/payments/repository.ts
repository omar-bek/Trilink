import { Payment, IPayment } from './schema';
import { PaymentStatus } from './schema';
import mongoose from 'mongoose';

export class PaymentRepository {
  /**
   * Create a new payment
   */
  async create(data: Partial<IPayment>): Promise<IPayment> {
    const payment = new Payment(data);
    return await payment.save();
  }

  /**
   * Find payment by ID
   */
  async findById(id: string): Promise<IPayment | null> {
    return await Payment.findOne({ _id: id, deletedAt: null });
  }

  /**
   * Find payments by contract ID
   */
  async findByContractId(contractId: string): Promise<IPayment[]> {
    return await Payment.find({
      contractId: new mongoose.Types.ObjectId(contractId),
      deletedAt: null,
    }).sort({ dueDate: 1 });
  }

  /**
   * Find payments by company ID
   */
  async findByCompanyId(
    companyId: string,
    filters?: { status?: PaymentStatus; recipientCompanyId?: string }
  ): Promise<IPayment[]> {
    const query: Record<string, unknown> = {
      $or: [
        { companyId: new mongoose.Types.ObjectId(companyId) },
        { recipientCompanyId: new mongoose.Types.ObjectId(companyId) },
      ],
      deletedAt: null,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.recipientCompanyId) {
      query.recipientCompanyId = new mongoose.Types.ObjectId(
        filters.recipientCompanyId
      );
    }

    return await Payment.find(query).sort({ dueDate: 1 });
  }

  /**
   * Update payment
   */
  async update(id: string, data: Partial<IPayment>): Promise<IPayment | null> {
    return await Payment.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  /**
   * Soft delete payment
   */
  async softDelete(id: string): Promise<void> {
    await Payment.findByIdAndUpdate(id, { deletedAt: new Date() });
  }
}
