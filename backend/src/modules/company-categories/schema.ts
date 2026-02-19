import mongoose, { Schema, Document } from 'mongoose';

export interface ICompanyCategory extends Document {
  companyId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CompanyCategorySchema = new Schema<ICompanyCategory>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate company-category pairs
CompanyCategorySchema.index({ companyId: 1, categoryId: 1 }, { unique: true });

// Compound indexes for efficient queries
CompanyCategorySchema.index({ categoryId: 1, companyId: 1 }); // Find companies by category
CompanyCategorySchema.index({ companyId: 1 }); // Find categories by company

export const CompanyCategory = mongoose.model<ICompanyCategory>(
  'CompanyCategory',
  CompanyCategorySchema
);
