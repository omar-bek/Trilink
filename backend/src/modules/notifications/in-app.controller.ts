import { Request, Response, NextFunction } from 'express';
import { InAppNotificationService } from './in-app.service';
import { ApiResponse } from '../../types/common';
import { getRequestId } from '../../utils/requestId';

export class InAppNotificationController {
  private service: InAppNotificationService;

  constructor() {
    this.service = new InAppNotificationService();
  }

  /**
   * Get notifications for the current user
   * GET /api/notifications
   */
  getNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { read, limit, skip, sortBy, sortOrder } = req.query;

      const result = await this.service.getNotifications(req.user.userId, {
        read: read === 'true' ? true : read === 'false' ? false : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        skip: skip ? parseInt(skip as string) : undefined,
        sortBy: sortBy as 'createdAt' | 'read' | undefined,
        sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      });

      const response: ApiResponse<{ notifications: any[]; total: number }> = {
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
   * Get unread notification count
   * GET /api/notifications/unread-count
   */
  getUnreadCount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const count = await this.service.getUnreadCount(req.user.userId);

      const response: ApiResponse<{ count: number }> = {
        success: true,
        data: { count },
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark notification as read
   * PATCH /api/notifications/:id/read
   */
  markAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const notification = await this.service.markAsRead(id, req.user.userId);

      const response: ApiResponse = {
        success: true,
        data: notification,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark all notifications as read
   * PATCH /api/notifications/read-all
   */
  markAllAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const count = await this.service.markAllAsRead(req.user.userId);

      const response: ApiResponse<{ count: number }> = {
        success: true,
        data: { count },
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a notification
   * DELETE /api/notifications/:id
   */
  deleteNotification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      await this.service.deleteNotification(id, req.user.userId);

      const response: ApiResponse = {
        success: true,
        data: { message: 'Notification deleted successfully' },
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete all notifications
   * DELETE /api/notifications
   */
  deleteAllNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const count = await this.service.deleteAllNotifications(req.user.userId);

      const response: ApiResponse<{ count: number }> = {
        success: true,
        data: { count },
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
