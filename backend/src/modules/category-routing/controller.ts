import { Request, Response, NextFunction } from 'express';
import { CategoryRoutingService } from './service';
import { ApiResponse } from '../../types/common';
import { getRequestId } from '../../utils/requestId';

export class CategoryRoutingController {
    private service: CategoryRoutingService;

    constructor() {
        this.service = new CategoryRoutingService();
    }

    /**
     * Find companies matching a purchase request category
     * GET /api/category-routing/match?categoryId=xxx&subCategoryId=yyy
     */
    findMatchingCompanies = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { categoryId, subCategoryId } = req.query;

            if (!categoryId || typeof categoryId !== 'string') {
                res.status(400).json({
                    success: false,
                    error: 'categoryId is required',
                    requestId: getRequestId(req),
                });
                return;
            }

            const matches = await this.service.findMatchingCompanies(
                categoryId,
                subCategoryId as string | undefined
            );

            const response: ApiResponse = {
                success: true,
                data: matches,
                requestId: getRequestId(req),
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Check if company can view a purchase request
     * GET /api/category-routing/can-view?companyId=xxx&categoryId=yyy&subCategoryId=zzz
     */
    canCompanyViewPurchaseRequest = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { companyId, categoryId, subCategoryId } = req.query;

            if (!companyId || !categoryId) {
                res.status(400).json({
                    success: false,
                    error: 'companyId and categoryId are required',
                    requestId: getRequestId(req),
                });
                return;
            }

            const canView = await this.service.canCompanyViewPurchaseRequest(
                companyId as string,
                categoryId as string,
                subCategoryId as string | undefined
            );

            const response: ApiResponse = {
                success: true,
                data: { canView },
                requestId: getRequestId(req),
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };
}
