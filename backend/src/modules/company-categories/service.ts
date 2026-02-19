import { CompanyCategoryRepository } from './repository';
import { CategoryRepository } from '../categories/repository';
import { AppError } from '../../middlewares/error.middleware';
import { CategoryResponse } from '../categories/types';
import { CategoryRoutingEventEmitter, CategoryEvent } from '../category-routing/events';

export class CompanyCategoryService {
  private repository: CompanyCategoryRepository;
  private categoryRepository: CategoryRepository;

  constructor() {
    this.repository = new CompanyCategoryRepository();
    this.categoryRepository = new CategoryRepository();
  }

  /**
   * Add categories to a company
   */
  async addCategoriesToCompany(
    companyId: string,
    categoryIds: string[]
  ): Promise<CategoryResponse[]> {
    // Validate all categories exist
    const categories = await this.categoryRepository.findByIds(categoryIds);
    if (categories.length !== categoryIds.length) {
      throw new AppError('One or more categories not found', 404);
    }

    // Ensure all categories are active
    const inactiveCategories = categories.filter((cat) => !cat.isActive);
    if (inactiveCategories.length > 0) {
      throw new AppError(
        `Cannot add inactive categories: ${inactiveCategories.map((c) => c.name).join(', ')}`,
        400
      );
    }

    const results = await this.repository.addCategoriesToCompany(companyId, categoryIds);

    // Emit events for each category added
    const addedCategoryIds = results.map((cc) => (cc.categoryId as any).toString());
    for (const categoryId of addedCategoryIds) {
      CategoryRoutingEventEmitter.emit(CategoryEvent.COMPANY_CATEGORY_ADDED, {
        companyId,
        categoryId,
      });
    }

    // Return category details
    const addedCategories = await this.categoryRepository.findByIds(addedCategoryIds);

    return addedCategories.map((cat) => ({
      id: cat._id.toString(),
      name: cat.name,
      nameAr: cat.nameAr,
      description: cat.description,
      parentId: cat.parentId?.toString(),
      level: cat.level,
      path: cat.path,
      isActive: cat.isActive,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));
  }

  /**
   * Remove a category from a company
   */
  async removeCategoryFromCompany(
    companyId: string,
    categoryId: string
  ): Promise<void> {
    await this.repository.removeCategoryFromCompany(companyId, categoryId);

    // Emit event for category removal (cache invalidation)
    CategoryRoutingEventEmitter.emit(CategoryEvent.COMPANY_CATEGORY_REMOVED, {
      companyId,
      categoryId,
    });
  }

  /**
   * Get all categories for a company
   */
  async getCompanyCategories(companyId: string): Promise<CategoryResponse[]> {
    const companyCategories = await this.repository.getCategoriesByCompany(companyId);
    const categoryIds = companyCategories.map((cc) => (cc.categoryId as any)._id.toString());
    const categories = await this.categoryRepository.findByIds(categoryIds);

    return categories.map((cat) => ({
      id: cat._id.toString(),
      name: cat.name,
      nameAr: cat.nameAr,
      description: cat.description,
      parentId: cat.parentId?.toString(),
      level: cat.level,
      path: cat.path,
      isActive: cat.isActive,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));
  }
}
