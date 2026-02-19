import { CategoryRepository } from './repository';
import {
    CreateCategoryDto,
    UpdateCategoryDto,
    CategoryResponse,
    CategoryTreeResponse,
} from './types';
import { AppError } from '../../middlewares/error.middleware';
import { ICategory } from './schema';
import { CategoryRoutingEventEmitter, CategoryEvent } from '../category-routing/events';

export class CategoryService {
    private repository: CategoryRepository;

    constructor() {
        this.repository = new CategoryRepository();
    }

    /**
     * Create a new category
     */
    async createCategory(data: CreateCategoryDto): Promise<CategoryResponse> {
        // Validate parent if provided
        if (data.parentId) {
            const parent = await this.repository.findById(data.parentId);
            if (!parent) {
                throw new AppError('Parent category not found', 404);
            }
            if (!parent.isActive) {
                throw new AppError('Cannot create sub-category under inactive parent', 400);
            }
        }

        const category = await this.repository.create({
            name: data.name,
            nameAr: data.nameAr,
            description: data.description,
            parentId: data.parentId ? (data.parentId as any) : undefined,
        });

        // Emit event for category creation (cache invalidation)
        CategoryRoutingEventEmitter.emit(CategoryEvent.CATEGORY_CREATED, category._id.toString());

        return this.toCategoryResponse(category);
    }

    /**
     * Get category by ID
     */
    async getCategoryById(id: string): Promise<CategoryResponse> {
        const category = await this.repository.findById(id);
        if (!category) {
            throw new AppError('Category not found', 404);
        }

        return await this.toCategoryResponse(category);
    }

    /**
     * Get all root categories
     */
    async getRootCategories(): Promise<CategoryResponse[]> {
        const categories = await this.repository.findRootCategories();
        return Promise.all(categories.map((cat) => this.toCategoryResponse(cat)));
    }

    /**
     * Get children of a category
     */
    async getCategoryChildren(parentId: string): Promise<CategoryResponse[]> {
        const parent = await this.repository.findById(parentId);
        if (!parent) {
            throw new AppError('Parent category not found', 404);
        }

        const children = await this.repository.findChildren(parentId);
        const parentName = parent.name;
        return children.map((cat) => this.toCategoryResponseSync(cat, parentName));
    }

    /**
     * Get category tree (hierarchical structure)
     */
    async getCategoryTree(): Promise<CategoryTreeResponse[]> {
        const rootCategories = await this.repository.findRootCategories();
        const tree: CategoryTreeResponse[] = [];

        for (const root of rootCategories) {
            const children = await this.repository.findChildren(root._id.toString());
            const rootResponse = await this.toCategoryResponse(root);
            const treeNode: CategoryTreeResponse = {
                ...rootResponse,
                children: children.map((child) => {
                    const childResponse = this.toCategoryResponseSync(child, root.name);
                    return childResponse as CategoryTreeResponse;
                }),
            };
            tree.push(treeNode);
        }

        return tree;
    }

    /**
     * Update category
     */
    async updateCategory(
        id: string,
        data: UpdateCategoryDto
    ): Promise<CategoryResponse> {
        const category = await this.repository.findById(id);
        if (!category) {
            throw new AppError('Category not found', 404);
        }

        // Validate parent if being changed
        if (data.parentId !== undefined) {
            if (data.parentId === id) {
                throw new AppError('Category cannot be its own parent', 400);
            }

            if (data.parentId) {
                const parent = await this.repository.findById(data.parentId);
                if (!parent) {
                    throw new AppError('Parent category not found', 404);
                }

                // Prevent circular references by checking if parent is a descendant
                const descendants = await this.repository.findDescendants(id);
                if (descendants.some((d) => d._id.toString() === data.parentId)) {
                    throw new AppError('Cannot set parent: would create circular reference', 400);
                }
            }
        }

        const wasActive = category.isActive;
        const updated = await this.repository.update(id, {
            name: data.name,
            nameAr: data.nameAr,
            description: data.description,
            parentId: data.parentId ? (data.parentId as any) : undefined,
            isActive: data.isActive,
        });

        if (!updated) {
            throw new AppError('Failed to update category', 500);
        }

        // Emit events for category changes
        if (data.isActive !== undefined && data.isActive !== wasActive) {
            if (!data.isActive) {
                CategoryRoutingEventEmitter.emit(CategoryEvent.CATEGORY_DEACTIVATED, id);
            } else {
                // Use CATEGORY_UPDATED for activation since CATEGORY_ACTIVATED doesn't exist
                CategoryRoutingEventEmitter.emit(CategoryEvent.CATEGORY_UPDATED, id);
            }
        } else {
            CategoryRoutingEventEmitter.emit(CategoryEvent.CATEGORY_UPDATED, id);
        }

        return await this.toCategoryResponse(updated);
    }

    /**
     * Delete category (soft delete)
     */
    async deleteCategory(id: string): Promise<void> {
        const category = await this.repository.findById(id);
        if (!category) {
            throw new AppError('Category not found', 404);
        }

        // Check if category has children
        const hasChildren = await this.repository.hasChildren(id);
        if (hasChildren) {
            throw new AppError(
                'Cannot delete category with sub-categories. Please delete or move sub-categories first.',
                400
            );
        }

        await this.repository.softDelete(id);

        // Emit event for category deletion (cache invalidation)
        CategoryRoutingEventEmitter.emit(CategoryEvent.CATEGORY_DELETED, id);
    }

    /**
     * Get all categories
     */
    async getAllCategories(includeInactive = false): Promise<CategoryResponse[]> {
        const categories = await this.repository.findAll(includeInactive);
        return Promise.all(categories.map((cat) => this.toCategoryResponse(cat)));
    }

    /**
     * Get descendants of a category
     */
    async getCategoryDescendants(id: string): Promise<CategoryResponse[]> {
        const category = await this.repository.findById(id);
        if (!category) {
            throw new AppError('Category not found', 404);
        }

        const descendants = await this.repository.findDescendants(id);
        return Promise.all(descendants.map((cat) => this.toCategoryResponse(cat)));
    }

    /**
     * Convert ICategory to CategoryResponse
     */
    private async toCategoryResponse(category: ICategory): Promise<CategoryResponse> {
        let parentName: string | undefined;
        if (category.parentId) {
            const parent = await this.repository.findById(category.parentId.toString());
            parentName = parent?.name;
        }

        return {
            id: category._id.toString(),
            name: category.name,
            nameAr: category.nameAr,
            description: category.description,
            parentId: category.parentId?.toString(),
            parentName,
            level: category.level,
            path: category.path,
            isActive: category.isActive,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        };
    }

    /**
     * Convert ICategory to CategoryResponse (synchronous version for batch operations)
     */
    private toCategoryResponseSync(category: ICategory, parentName?: string): CategoryResponse {
        return {
            id: category._id.toString(),
            name: category.name,
            nameAr: category.nameAr,
            description: category.description,
            parentId: category.parentId?.toString(),
            parentName,
            level: category.level,
            path: category.path,
            isActive: category.isActive,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        };
    }
}
