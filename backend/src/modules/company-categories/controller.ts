import { Request, Response, NextFunction } from 'express';
import { CompanyCategoryService } from './service';
import { ApiResponse } from '../../types/common';
import { getRequestId } from '../../utils/requestId';

export class CompanyCategoryController {
    private service: CompanyCategoryService;

    constructor() {
        this.service = new CompanyCategoryService();
    }

    /**
     * Add categories to a company
     * POST /api/companies/:companyId/categories
     */
    addCategoriesToCompany = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { companyId } = req.params;
            const { categoryIds } = req.body;

            if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
                res.status(400).json({
                    success: false,
                    error: 'categoryIds must be a non-empty array',
                    requestId: getRequestId(req),
                });
                return;
            }

            const result = await this.service.addCategoriesToCompany(companyId, categoryIds);

            const response: ApiResponse = {
                success: true,
                data: result,
                requestId: getRequestId(req),
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Remove a category from a company
     * DELETE /api/companies/:companyId/categories/:categoryId
     */
    removeCategoryFromCompany = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { companyId, categoryId } = req.params;
            await this.service.removeCategoryFromCompany(companyId, categoryId);

            const response: ApiResponse = {
                success: true,
                data: { message: 'Category removed successfully' },
                requestId: getRequestId(req),
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get all categories for a company
     * GET /api/companies/:companyId/categories
     */
    getCompanyCategories = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { companyId } = req.params;
            const categories = await this.service.getCompanyCategories(companyId);

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
}
