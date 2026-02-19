import { Company, ICompany } from './schema';
import { Status } from '../../types/common';
import { CompanyType } from './schema';
import mongoose from 'mongoose';

export class CompanyRepository {
  /**
   * Create a new company
   */
  async create(data: Partial<ICompany>): Promise<ICompany> {
    const company = new Company(data);
    return await company.save();
  }

  /**
   * Find company by ID (excluding soft-deleted)
   */
  async findById(id: string): Promise<ICompany | null> {
    return await Company.findOne({ _id: id, deletedAt: null });
  }

  /**
   * Find company by registration number
   */
  async findByRegistrationNumber(
    registrationNumber: string
  ): Promise<ICompany | null> {
    return await Company.findOne({
      registrationNumber,
      deletedAt: null,
    });
  }

  /**
   * Find companies by type and status
   */
  async findByTypeAndStatus(
    type?: CompanyType,
    status?: Status
  ): Promise<ICompany[]> {
    const query: Record<string, unknown> = { deletedAt: null };

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    return await Company.find(query);
  }

  /**
   * Update company
   */
  async update(id: string, data: Partial<ICompany>): Promise<ICompany | null> {
    return await Company.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  /**
   * Soft delete company
   */
  async softDelete(id: string): Promise<void> {
    await Company.findByIdAndUpdate(id, { deletedAt: new Date() });
  }

  /**
   * Check if registration number exists
   */
  async registrationNumberExists(
    registrationNumber: string,
    excludeId?: string
  ): Promise<boolean> {
    const query: Record<string, unknown> = {
      registrationNumber,
      deletedAt: null,
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const count = await Company.countDocuments(query);
    return count > 0;
  }

  /**
   * Add document to company
   */
  async addDocument(
    id: string,
    document: { type: string; url: string }
  ): Promise<ICompany | null> {
    return await Company.findByIdAndUpdate(
      id,
      {
        $push: {
          documents: {
            ...document,
            uploadedAt: new Date(),
          },
        },
      },
      { new: true }
    );
  }
}
