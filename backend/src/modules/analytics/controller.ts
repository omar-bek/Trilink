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
   * GET /api/analytics/government?startDate=2024-01-01&endDate=2024-12-31
   */
  getGovernmentAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      const filters: any = {};
      
      if (startDate) {
        filters.startDate = new Date(startDate as string);
      }
      if (endDate) {
        filters.endDate = new Date(endDate as string);
      }

      const analytics = await this.service.getGovernmentAnalytics(filters);

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
   * GET /api/analytics/company?startDate=2024-01-01&endDate=2024-12-31
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

      const { startDate, endDate } = req.query;
      const filters: any = {};
      
      if (startDate) {
        filters.startDate = new Date(startDate as string);
      }
      if (endDate) {
        filters.endDate = new Date(endDate as string);
      }

      const analytics = await this.service.getCompanyAnalytics(
        req.user.companyId,
        filters
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

  /**
   * Stream purchase requests for export
   * GET /api/analytics/stream/purchase-requests
   */
  streamPurchaseRequests = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      const filters: any = {};
      
      if (startDate) {
        filters.startDate = new Date(startDate as string);
      }
      if (endDate) {
        filters.endDate = new Date(endDate as string);
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="purchase-requests.json"');

      const stream = this.service.streamPurchaseRequests(filters);
      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  };
}
