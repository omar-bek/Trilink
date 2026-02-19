import { CompanyCategory, ICompanyCategory } from './schema';
import mongoose from 'mongoose';

/**
 * Validate if a string is a valid MongoDB ObjectId
 */
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
}

export class CompanyCategoryRepository {
  /**
   * Add a category to a company
   */
  async addCategoryToCompany(
    companyId: string,
    categoryId: string
  ): Promise<ICompanyCategory> {
    if (!isValidObjectId(companyId) || !isValidObjectId(categoryId)) {
      throw new Error('Invalid company or category ID');
    }

    // Check if relationship already exists
    const existing = await CompanyCategory.findOne({
      companyId: new mongoose.Types.ObjectId(companyId),
      categoryId: new mongoose.Types.ObjectId(categoryId),
    });

    if (existing) {
      return existing;
    }

    const companyCategory = new CompanyCategory({
      companyId: new mongoose.Types.ObjectId(companyId),
      categoryId: new mongoose.Types.ObjectId(categoryId),
    });

    return await companyCategory.save();
  }

  /**
   * Remove a category from a company
   */
  async removeCategoryFromCompany(
    companyId: string,
    categoryId: string
  ): Promise<void> {
    if (!isValidObjectId(companyId) || !isValidObjectId(categoryId)) {
      throw new Error('Invalid company or category ID');
    }

    await CompanyCategory.deleteOne({
      companyId: new mongoose.Types.ObjectId(companyId),
      categoryId: new mongoose.Types.ObjectId(categoryId),
    });
  }

  /**
   * Get all categories for a company
   */
  async getCategoriesByCompany(companyId: string): Promise<ICompanyCategory[]> {
    if (!isValidObjectId(companyId)) {
      return [];
    }

    return await CompanyCategory.find({
      companyId: new mongoose.Types.ObjectId(companyId),
    }).populate('categoryId');
  }

  /**
   * Get all companies for a category (with optional sub-category matching)
   */
  async getCompaniesByCategory(
    categoryId: string,
    includeSubCategories = false
  ): Promise<ICompanyCategory[]> {
    if (!isValidObjectId(categoryId)) {
      return [];
    }

    const query: any = {
      categoryId: new mongoose.Types.ObjectId(categoryId),
    };

    // If includeSubCategories is true, we need to find all companies
    // that have either the category or any of its sub-categories
    if (includeSubCategories) {
      // This will be handled by the service layer using CategoryRepository
      // to get all descendant categories first
    }

    return await CompanyCategory.find(query).populate('companyId');
  }

  /**
   * Get companies by multiple categories (OR condition)
   */
  async getCompaniesByCategories(
    categoryIds: string[]
  ): Promise<ICompanyCategory[]> {
    if (categoryIds.length === 0) {
      return [];
    }

    const objectIds = categoryIds
      .filter((id) => isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    return await CompanyCategory.find({
      categoryId: { $in: objectIds },
    }).populate('companyId');
  }

  /**
   * Check if company has category
   */
  async companyHasCategory(
    companyId: string,
    categoryId: string
  ): Promise<boolean> {
    if (!isValidObjectId(companyId) || !isValidObjectId(categoryId)) {
      return false;
    }

    const count = await CompanyCategory.countDocuments({
      companyId: new mongoose.Types.ObjectId(companyId),
      categoryId: new mongoose.Types.ObjectId(categoryId),
    });

    return count > 0;
  }

  /**
   * Remove all categories from a company
   */
  async removeAllCategoriesFromCompany(companyId: string): Promise<void> {
    if (!isValidObjectId(companyId)) {
      return;
    }

    await CompanyCategory.deleteMany({
      companyId: new mongoose.Types.ObjectId(companyId),
    });
  }

  /**
   * Batch add categories to company
   */
  async addCategoriesToCompany(
    companyId: string,
    categoryIds: string[]
  ): Promise<ICompanyCategory[]> {
    if (!isValidObjectId(companyId)) {
      throw new Error('Invalid company ID');
    }

    const results: ICompanyCategory[] = [];

    for (const categoryId of categoryIds) {
      if (isValidObjectId(categoryId)) {
        try {
          const companyCategory = await this.addCategoryToCompany(
            companyId,
            categoryId
          );
          results.push(companyCategory);
        } catch (error) {
          // Skip duplicates or invalid categories
          continue;
        }
      }
    }

    return results;
  }
}
