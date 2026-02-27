import { Category, ICategory } from './schema';
import mongoose from 'mongoose';

/**
 * Validate if a string is a valid MongoDB ObjectId
 */
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
}

export class CategoryRepository {
  /**
   * Create a new category
   */
  async create(data: Partial<ICategory>): Promise<ICategory> {
    const category = new Category(data);
    return await category.save();
  }

  /**
   * Find category by ID (excluding soft-deleted)
   */
  async findById(id: string): Promise<ICategory | null> {
    if (!isValidObjectId(id)) {
      return null;
    }
    return await Category.findOne({ _id: id, deletedAt: null });
  }

  /**
   * Find all root categories (level 0)
   */
  async findRootCategories(): Promise<ICategory[]> {
    const query = {
      level: 0,
      deletedAt: null,
      isActive: true,
    };
    
    // Debug logging
    console.log('[CategoryRepository] findRootCategories - Query:', JSON.stringify(query));
    
    const categories = await Category.find(query).sort({ name: 1 });
    
    // Debug logging
    console.log('[CategoryRepository] findRootCategories - Found:', categories.length, 'categories');
    if (categories.length === 0) {
      // Check if there are any categories at all
      const totalCount = await Category.countDocuments({ deletedAt: null });
      const activeCount = await Category.countDocuments({ deletedAt: null, isActive: true });
      const rootCount = await Category.countDocuments({ level: 0, deletedAt: null });
      console.log('[CategoryRepository] findRootCategories - Database stats:', {
        total: totalCount,
        active: activeCount,
        root: rootCount,
        rootActive: await Category.countDocuments({ level: 0, deletedAt: null, isActive: true }),
      });
    }
    
    return categories;
  }

  /**
   * Find all children of a parent category
   */
  async findChildren(parentId: string): Promise<ICategory[]> {
    if (!isValidObjectId(parentId)) {
      return [];
    }
    return await Category.find({
      parentId: new mongoose.Types.ObjectId(parentId),
      deletedAt: null,
      isActive: true,
    }).sort({ name: 1 });
  }

  /**
   * Find category by name
   */
  async findByName(name: string): Promise<ICategory | null> {
    return await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      deletedAt: null,
    });
  }

  /**
   * Find all categories (for admin/management)
   */
  async findAll(includeInactive = false): Promise<ICategory[]> {
    const query: Record<string, unknown> = { deletedAt: null };
    if (!includeInactive) {
      query.isActive = true;
    }
    return await Category.find(query).sort({ level: 1, name: 1 });
  }

  /**
   * Find categories by IDs
   */
  async findByIds(ids: string[]): Promise<ICategory[]> {
    if (ids.length === 0) {
      return [];
    }
    const objectIds = ids
      .filter((id) => isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    return await Category.find({
      _id: { $in: objectIds },
      deletedAt: null,
    });
  }

  /**
   * Get category tree (hierarchical structure)
   */
  async getCategoryTree(): Promise<ICategory[]> {
    const rootCategories = await this.findRootCategories();
    const tree: ICategory[] = [];

    for (const root of rootCategories) {
      const children = await this.findChildren(root._id.toString());
      (root as any).children = children;
      tree.push(root);
    }

    return tree;
  }

  /**
   * Find all descendants of a category (including nested children)
   */
  async findDescendants(categoryId: string): Promise<ICategory[]> {
    if (!isValidObjectId(categoryId)) {
      return [];
    }
    const category = await this.findById(categoryId);
    if (!category) {
      return [];
    }

    const categoryPath = category.path;

    // Find all categories whose path starts with the current category's path
    const allCategories = await Category.find({
      path: { $regex: new RegExp(`^${categoryPath}/`) },
      deletedAt: null,
      isActive: true,
    });

    return allCategories;
  }

  /**
   * Check if updating parent would create a circular reference
   */
  async wouldCreateCycle(categoryId: string, newParentId: string): Promise<boolean> {
    if (categoryId === newParentId) {
      return true; // Cannot be its own parent
    }

    // Check if newParentId is a descendant of categoryId
    const descendants = await this.findDescendants(categoryId);
    return descendants.some(d => d._id.toString() === newParentId);
  }

  /**
   * Update category with cycle detection
   */
  async update(id: string, data: Partial<ICategory>): Promise<ICategory | null> {
    // EDGE CASE: Detect circular references
    if (data.parentId) {
      const wouldCreateCycle = await this.wouldCreateCycle(id, data.parentId.toString());
      if (wouldCreateCycle) {
        throw new Error('Cannot create circular reference in category hierarchy');
      }
    }

    return await Category.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  /**
   * Soft delete category
   */
  async softDelete(id: string): Promise<void> {
    await Category.findByIdAndUpdate(id, { deletedAt: new Date() });
  }

  /**
   * Check if category has children
   */
  async hasChildren(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) {
      return false;
    }
    const count = await Category.countDocuments({
      parentId: new mongoose.Types.ObjectId(id),
      deletedAt: null,
    });
    return count > 0;
  }
}
