import { Contract, IContract } from './schema';
import { ContractStatus } from './schema';
import { ContractQueryFilters } from './types';
import mongoose from 'mongoose';

export class ContractRepository {
  /**
   * Create a new contract
   */
  async create(data: Partial<IContract>): Promise<IContract> {
    const contract = new Contract(data);
    return await contract.save();
  }

  /**
   * Find contract by ID
   * Optionally populate related documents
   */
  async findById(
    id: string,
    populateOptions?: {
      populateParties?: boolean;
      populatePurchaseRequest?: boolean;
    }
  ): Promise<IContract | null> {
    let query: any = Contract.findOne({ _id: id, deletedAt: null });

    if (populateOptions?.populateParties) {
      query = query.populate([
        { path: 'parties.companyId', model: 'Company', select: 'name type email phone address' },
        { path: 'parties.userId', model: 'User', select: 'email firstName lastName role' },
      ]);
    }

    if (populateOptions?.populatePurchaseRequest) {
      query = query.populate({
        path: 'purchaseRequestId',
        model: 'PurchaseRequest',
        select: 'title description deliveryLocation requiredDeliveryDate',
      });
    }

    return (await query.exec()) as IContract | null;
  }

  /**
   * Find contracts by purchase request ID
   */
  async findByPurchaseRequestId(
    purchaseRequestId: string
  ): Promise<IContract[]> {
    return await Contract.find({
      purchaseRequestId: new mongoose.Types.ObjectId(purchaseRequestId),
      deletedAt: null,
    });
  }

  /**
   * Find contracts by company ID
   * Optimized with populate for related data
   */
  async findByCompanyId(
    companyId: string,
    filters?: { status?: ContractStatus }
  ): Promise<IContract[]> {
    const query: Record<string, unknown> = {
      $or: [
        { buyerCompanyId: new mongoose.Types.ObjectId(companyId) },
        { 'parties.companyId': new mongoose.Types.ObjectId(companyId) },
      ],
      deletedAt: null,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    return await Contract.find(query)
      .populate('buyerCompanyId', 'name type email')
      .populate('parties.companyId', 'name type email')
      .populate('parties.userId', 'email firstName lastName role')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Find contracts with advanced filtering, search, sorting, and pagination
   */
  async findWithFilters(
    companyId: string,
    filters: ContractQueryFilters
  ): Promise<{ contracts: IContract[]; total: number }> {
    const baseOrConditions = [
      { buyerCompanyId: new mongoose.Types.ObjectId(companyId) },
      { 'parties.companyId': new mongoose.Types.ObjectId(companyId) },
    ];

    const query: Record<string, unknown> = {
      $and: [
        { $or: baseOrConditions },
        { deletedAt: null },
      ],
    };

    // Text search - use MongoDB text search
    if (filters.search) {
      (query.$and as unknown[]).push({
        $text: { $search: filters.search },
      });
    }

    // Status filter
    if (filters.status) {
      (query.$and as unknown[]).push({ status: filters.status });
    }

    // Date range filters (on createdAt)
    if (filters.dateFrom || filters.dateTo) {
      const dateQuery: Record<string, unknown> = {};
      if (filters.dateFrom) {
        dateQuery.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        dateQuery.$lte = filters.dateTo;
      }
      (query.$and as unknown[]).push({ createdAt: dateQuery });
    }

    // Amount range filters
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      const amountQuery: Record<string, unknown> = {};
      if (filters.minAmount !== undefined) {
        amountQuery.$gte = filters.minAmount;
      }
      if (filters.maxAmount !== undefined) {
        amountQuery.$lte = filters.maxAmount;
      }
      (query.$and as unknown[]).push({ 'amounts.total': amountQuery });
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    if (filters.sortBy) {
      // Map common sort fields
      let sortField = filters.sortBy;
      if (sortField === 'amount') {
        sortField = 'amounts.total';
      } else if (sortField === 'date') {
        sortField = 'createdAt';
      }
      sort[sortField] = filters.sortOrder === 'asc' ? 1 : -1;
    } else {
      // Default sort by createdAt descending
      sort.createdAt = -1;
    }

    // Pagination
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 20; // Max 100 per page
    const skip = (page - 1) * limit;

    // Execute query with pagination and populate for related data
    const contracts = await Contract.find(query)
      .populate('buyerCompanyId', 'name type email')
      .populate('parties.companyId', 'name type email')
      .populate('parties.userId', 'email firstName lastName role')
      .populate('purchaseRequestId', 'title status')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    // Get total count for pagination metadata
    const total = await Contract.countDocuments(query);

    return { contracts, total };
  }

  /**
   * Update contract
   */
  async update(
    id: string,
    data: Partial<IContract>
  ): Promise<IContract | null> {
    return await Contract.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  /**
   * Add signature to contract
   * Uses atomic update to prevent race conditions
   */
  async addSignature(
    id: string,
    signature: {
      partyId: mongoose.Types.ObjectId;
      userId: mongoose.Types.ObjectId;
      signature: string;
    }
  ): Promise<IContract | null> {
    return await Contract.findByIdAndUpdate(
      id,
      {
        $push: {
          signatures: {
            ...signature,
            signedAt: new Date(),
          },
        },
        $inc: { version: 1 }, // Increment version for optimistic locking
        updatedAt: new Date(),
      },
      { new: true }
    );
  }

  /**
   * Atomically add signature and update status if all parties have signed
   * Uses optimistic locking with version field to prevent race conditions
   * Returns the updated contract or null if version conflict or party already signed
   */
  async addSignatureAtomically(
    id: string,
    signature: {
      partyId: mongoose.Types.ObjectId;
      userId: mongoose.Types.ObjectId;
      signature: string;
      signatureHash?: string;
      certificate?: string;
      algorithm?: string;
      verified?: boolean;
    },
    expectedVersion: number
  ): Promise<IContract | null> {
    // Get contract to check total parties count (needed for status update logic)
    const contractDoc = await Contract.findById(id);
    if (!contractDoc) {
      return null;
    }

    const totalParties = contractDoc.parties.length;
    const currentSignatureCount = contractDoc.signatures.length;
    const willBeComplete = currentSignatureCount + 1 === totalParties;

    // Build atomic update query
    const updateQuery: any = {
      $push: {
        signatures: {
          partyId: signature.partyId,
          userId: signature.userId,
          signature: signature.signature,
          signatureHash: signature.signatureHash || '',
          certificate: signature.certificate,
          algorithm: signature.algorithm || 'RSA-SHA256',
          verified: signature.verified !== undefined ? signature.verified : false,
          signedAt: new Date(),
        },
      },
      $inc: { version: 1 },
      $set: {
        updatedAt: new Date(),
      },
    };

    // Conditionally update status atomically
    // If this signature completes all signatures, set status to SIGNED
    // Otherwise, if status is DRAFT, set to PENDING_SIGNATURES
    if (willBeComplete) {
      updateQuery.$set.status = ContractStatus.SIGNED;
    } else if (contractDoc.status === ContractStatus.DRAFT) {
      updateQuery.$set.status = ContractStatus.PENDING_SIGNATURES;
    }

    // Use findOneAndUpdate with version check for atomic operation
    // Only succeeds if version matches (optimistic locking) and party hasn't signed
    // The version check ensures that if another party signed concurrently,
    // this update will fail and the caller can retry
    const updated = await Contract.findOneAndUpdate(
      {
        _id: id,
        version: expectedVersion, // Optimistic locking: only update if version matches
        'signatures.partyId': { $ne: signature.partyId }, // Ensure party hasn't signed
        // Additional check: ensure we're not already at SIGNED status
        // (prevents race condition where status was already updated)
        status: { $in: [ContractStatus.DRAFT, ContractStatus.PENDING_SIGNATURES] },
      },
      updateQuery,
      {
        new: true,
        runValidators: true,
      }
    );

    return updated;
  }

  /**
   * Update payment milestone status
   */
  async updatePaymentMilestone(
    contractId: string,
    milestone: string,
    status: string
  ): Promise<void> {
    await Contract.updateOne(
      {
        _id: contractId,
        'paymentSchedule.milestone': milestone,
      },
      {
        $set: {
          'paymentSchedule.$.status': status,
        },
        updatedAt: new Date(),
      }
    );
  }

  /**
   * Soft delete contract
   */
  async softDelete(id: string): Promise<void> {
    await Contract.findByIdAndUpdate(id, { deletedAt: new Date() });
  }

  /**
   * Find all contracts (for analytics)
   * Optimized with populate for related data
   */
  async findAll(filters?: { status?: ContractStatus }): Promise<IContract[]> {
    const query: Record<string, unknown> = {
      deletedAt: null,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    return await Contract.find(query)
      .populate('buyerCompanyId', 'name type')
      .populate('parties.companyId', 'name type')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get contract statistics using aggregation pipeline
   * Optimized for analytics queries
   */
  async getContractStats(filters?: {
    companyId?: string;
    status?: ContractStatus;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{
    total: number;
    totalAmount: number;
    byStatus: Array<{ status: string; count: number; totalAmount: number }>;
    byCompany: Array<{ companyId: string; count: number; totalAmount: number }>;
  }> {
    const matchStage: Record<string, unknown> = {
      deletedAt: null,
    };

    if (filters?.companyId) {
      matchStage.$or = [
        { buyerCompanyId: new mongoose.Types.ObjectId(filters.companyId) },
        { 'parties.companyId': new mongoose.Types.ObjectId(filters.companyId) },
      ];
    }

    if (filters?.status) {
      matchStage.status = filters.status;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      const createdAtFilter: { $gte?: Date; $lte?: Date } = {};
      if (filters.dateFrom) {
        createdAtFilter.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        createdAtFilter.$lte = filters.dateTo;
      }
      matchStage.createdAt = createdAtFilter;
    }

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $facet: {
          total: [{ $count: 'count' }],
          totalAmount: [
            {
              $group: {
                _id: null,
                total: { $sum: '$amounts.total' },
              },
            },
          ],
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amounts.total' },
              },
            },
            {
              $project: {
                _id: 0,
                status: '$_id',
                count: 1,
                totalAmount: 1,
              },
            },
          ],
          byCompany: [
            {
              $unwind: '$parties',
            },
            {
              $group: {
                _id: '$parties.companyId',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amounts.total' },
              },
            },
            {
              $project: {
                _id: 0,
                companyId: { $toString: '$_id' },
                count: 1,
                totalAmount: 1,
              },
            },
            { $limit: 10 },
          ],
        },
      },
    ];

    const result = await Contract.aggregate(pipeline);

    if (result.length === 0) {
      return {
        total: 0,
        totalAmount: 0,
        byStatus: [],
        byCompany: [],
      };
    }

    const stats = result[0];

    return {
      total: stats.total[0]?.count || 0,
      totalAmount: stats.totalAmount[0]?.total || 0,
      byStatus: stats.byStatus || [],
      byCompany: stats.byCompany || [],
    };
  }
}
