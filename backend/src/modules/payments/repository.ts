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
   * Optionally populate related documents
   */
  async findById(id: string, populate?: boolean): Promise<IPayment | null> {
    let query = Payment.findOne({ _id: id, deletedAt: null });
    
    if (populate) {
      query = query
        .populate('companyId', 'name type email')
        .populate('recipientCompanyId', 'name type email')
        .populate('contractId', 'status amounts paymentSchedule')
        .populate('buyerId', 'email firstName lastName');
    }
    
    return await query.exec();
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
   * Optimized with populate for related data
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

    return await Payment.find(query)
      .populate('companyId', 'name type email')
      .populate('recipientCompanyId', 'name type email')
      .populate('contractId', 'status amounts')
      .sort({ dueDate: 1 })
      .exec();
  }

  /**
   * Find payments by company ID with pagination
   */
  async findByCompanyIdPaginated(
    companyId: string,
    filters?: { status?: PaymentStatus; recipientCompanyId?: string },
    options?: { skip?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<{ payments: IPayment[]; total: number }> {
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

    const sort: Record<string, 1 | -1> = {};
    if (options?.sortBy) {
      sort[options.sortBy] = options.sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.dueDate = 1;
    }

    const skip = options?.skip || 0;
    const limit = options?.limit || 20;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('companyId', 'name type email')
        .populate('recipientCompanyId', 'name type email')
        .populate('contractId', 'status amounts')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      Payment.countDocuments(query),
    ]);

    return { payments, total };
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

  /**
   * Find all payments (for analytics)
   */
  async findAll(filters?: { status?: PaymentStatus }): Promise<IPayment[]> {
    const query: Record<string, unknown> = {
      deletedAt: null,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    return await Payment.find(query).sort({ createdAt: -1 });
  }
}
