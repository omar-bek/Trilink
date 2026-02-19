import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './service';
import { ApiResponse } from '../../types/common';
import { getRequestId } from '../../utils/requestId';

export class AnalyticsController {
  private service: AnalyticsService;

  constructor() {
    this.service = new AnalyticsService();
  }

  /**
   * Get government analytics
   * GET /api/analytics/government
   */
  getGovernmentAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const analytics = await this.service.getGovernmentAnalytics();

      const response: ApiResponse = {
        success: true,
        data: analytics,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get company analytics
   * GET /api/analytics/company
   */
  getCompanyAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const analytics = await this.service.getCompanyAnalytics(
        req.user.companyId
      );

      const response: ApiResponse = {
        success: true,
        data: analytics,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
