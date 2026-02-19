import { Request, Response, NextFunction } from 'express';
import { CategoryService } from './service';
import { ApiResponse } from '../../types/common';
import { getRequestId } from '../../utils/requestId';
import {
    CreateCategoryDto,
    UpdateCategoryDto,
} from './types';

export class CategoryController {
    private service: CategoryService;

    constructor() {
        this.service = new CategoryService();
    }

    /**
     * Create a new category
     * POST /api/categories
     */
    createCategory = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const data: CreateCategoryDto = req.body;
            const category = await this.service.createCategory(data);

            const response: ApiResponse = {
                success: true,
                data: category,
                requestId: getRequestId(req),
            };

            res.status(201).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get category by ID
     * GET /api/categories/:id
     */
    getCategoryById = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const category = await this.service.getCategoryById(id);

            const response: ApiResponse = {
                success: true,
                data: category,
                requestId: getRequestId(req),
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get all root categories
     * GET /api/categories
     */
    getRootCategories = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const categories = await this.service.getRootCategories();

            // Debug logging
            console.log('[CategoryController] getRootCategories - Found categories:', categories.length);
            if (categories.length === 0) {
                console.warn('[CategoryController] getRootCategories - No root categories found in database');
                // Get database stats for debugging
                try {
                    const allCategories = await this.service.getAllCategories(false);
                    console.log('[CategoryController] Database stats - Active categories:', allCategories.length);
                    if (allCategories.length > 0) {
                        console.log('[CategoryController] Sample active category:', allCategories[0]);
                        // Check if any are root level
                        const rootLevelCategories = allCategories.filter((cat: any) => cat.level === 0);
                        console.log('[CategoryController] Root level categories (level 0):', rootLevelCategories.length);
                        if (rootLevelCategories.length > 0) {
                            console.log('[CategoryController] Sample root category:', rootLevelCategories[0]);
                        }
                    }
                } catch (error) {
                    console.error('[CategoryController] Error getting all categories:', error);
                }
            } else {
                console.log('[CategoryController] Sample category:', JSON.stringify(categories[0], null, 2));
            }

            const response: ApiResponse = {
                success: true,
                data: categories,
                requestId: getRequestId(req),
            };

            res.status(200).json(response);
        } catch (error) {
            console.error('[CategoryController] getRootCategories - Error:', error);
            next(error);
        }
    };

    /**
     * Get category tree (hierarchical)
     * GET /api/categories/tree
     */
    getCategoryTree = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const tree = await this.service.getCategoryTree();

            const response: ApiResponse = {
                success: true,
                data: tree,
                requestId: getRequestId(req),
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get children of a category
     * GET /api/categories/:id/children
     */
    getCategoryChildren = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const children = await this.service.getCategoryChildren(id);

            const response: ApiResponse = {
                success: true,
                data: children,
                requestId: getRequestId(req),
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Update category
     * PUT /api/categories/:id
     */
    updateCategory = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const data: UpdateCategoryDto = req.body;
            const category = await this.service.updateCategory(id, data);

            const response: ApiResponse = {
                success: true,
                data: category,
                requestId: getRequestId(req),
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Delete category
     * DELETE /api/categories/:id
     */
    deleteCategory = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = req.params;
            await this.service.deleteCategory(id);

            const response: ApiResponse = {
                success: true,
                data: { message: 'Category deleted successfully' },
                requestId: getRequestId(req),
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get all categories (public - active only)
     * GET /api/categories/all
     */
    getAllCategories = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            // Public endpoint: only return active categories
            const categories = await this.service.getAllCategories(false);

            const response: ApiResponse = {
                success: true,
                data: categories,
                requestId: getRequestId(req),
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get all categories including inactive (admin only)
     * GET /api/categories/admin/all
     */
    getAllCategoriesAdmin = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const includeInactive = req.query.includeInactive === 'true';
            const categories = await this.service.getAllCategories(includeInactive);

            const response: ApiResponse = {
                success: true,
                data: categories,
                requestId: getRequestId(req),
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get database stats for categories (for debugging)
     * GET /api/categories/stats
     */
    getCategoryStats = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const allCategories = await this.service.getAllCategories(false);
            const allCategoriesIncludingInactive = await this.service.getAllCategories(true);
            const rootCategories = await this.service.getRootCategories();

            // Debug: Log actual category structure
            console.log('[CategoryController] getCategoryStats - Sample root category:', JSON.stringify(rootCategories[0], null, 2));
            console.log('[CategoryController] getCategoryStats - Root categories count:', rootCategories.length);

            const stats = {
                totalCategories: allCategoriesIncludingInactive.length,
                activeCategories: allCategories.length,
                rootCategories: rootCategories.length,
                sampleCategories: rootCategories.slice(0, 5).map((cat) => {
                    // Ensure we extract the actual data
                    return {
                        id: cat.id || (cat as any)._id?.toString() || '',
                        name: cat.name || '',
                        nameAr: cat.nameAr || '',
                        level: cat.level || 0,
                        isActive: cat.isActive !== undefined ? cat.isActive : true,
                    };
                }).filter((cat) => cat.id && cat.name),
                allCategoriesSample: allCategories.slice(0, 10).map((cat) => {
                    return {
                        id: cat.id || (cat as any)._id?.toString() || '',
                        name: cat.name || '',
                        level: cat.level || 0,
                        isActive: cat.isActive !== undefined ? cat.isActive : true,
                    };
                }).filter((cat) => cat.id && cat.name),
            };

            const response: ApiResponse = {
                success: true,
                data: stats,
                requestId: getRequestId(req),
            };

            res.status(200).json(response);
        } catch (error) {
            console.error('[CategoryController] getCategoryStats - Error:', error);
            next(error);
        }
    };
}
