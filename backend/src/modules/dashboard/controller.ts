import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './service';
import { ApiResponse } from '../../types/common';
import { getRequestId } from '../../utils/requestId';
import { Role } from '../../config/rbac';

export class DashboardController {
  private service: DashboardService;

  constructor() {
    this.service = new DashboardService();
  }

  /**
   * Get dashboard data
   * GET /api/dashboard
   * Accessible to all authenticated users
   */
  getDashboard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          requestId: getRequestId(req),
        });
        return;
      }

      const userId = req.user.userId;
      const companyId = req.user.companyId;
      const role = req.user.role;

      if (!companyId) {
        res.status(400).json({
          success: false,
          error: 'User must be associated with a company',
          requestId: getRequestId(req),
        });
        return;
      }

      const dashboardData = await this.service.getDashboardData(
        userId,
        companyId,
        role as Role
      );

      const response: ApiResponse = {
        success: true,
        data: dashboardData,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
