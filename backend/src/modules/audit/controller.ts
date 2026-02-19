import { Request, Response, NextFunction } from 'express';
import { AuditLogRepository, AuditLogFilters } from './repository';
import { ApiResponse } from '../../types/common';
import { getRequestId } from '../../utils/requestId';
import { Role } from '../../config/rbac';
import { AuditExportService } from './export.service';

export class AuditLogController {
  private repository: AuditLogRepository;
  private exportService: AuditExportService;

  constructor() {
    this.repository = new AuditLogRepository();
    this.exportService = new AuditExportService();
  }

  /**
   * Get audit logs
   * GET /api/audit
   * All authenticated users can view their company's audit logs
   * Admin and Government can view all audit logs
   */
  getAuditLogs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const {
        userId,
        companyId,
        action,
        resource,
        resourceId,
        status,
        startDate,
        endDate,
        limit,
        skip,
      } = req.query;

      const userRole = req.user.role as Role;
      const userCompanyId = req.user.companyId;

      const filters: AuditLogFilters = {};
      
      // Company isolation: Non-admin/government users can only see their company's logs
      if (userRole !== Role.ADMIN && userRole !== Role.GOVERNMENT) {
        if (!userCompanyId) {
          res.status(403).json({
            success: false,
            error: 'User must belong to a company',
            requestId: getRequestId(req),
          });
          return;
        }
        // Force filter by user's company
        filters.companyId = userCompanyId;
      } else {
        // Admin and Government can filter by any company if provided
        if (companyId) {
          filters.companyId = companyId as string;
        }
      }

      if (userId) filters.userId = userId as string;
      if (action) filters.action = action as string;
      if (resource) filters.resource = resource as string;
      if (resourceId) filters.resourceId = resourceId as string;
      if (status) filters.status = status as 'success' | 'failure';
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const logs = await this.repository.find(
        filters,
        limit ? parseInt(limit as string, 10) : 100,
        skip ? parseInt(skip as string, 10) : 0
      );

      const total = await this.repository.count(filters);

      const response: ApiResponse = {
        success: true,
        data: {
          logs,
          pagination: {
            total,
            limit: limit ? parseInt(limit as string, 10) : 100,
            skip: skip ? parseInt(skip as string, 10) : 0,
          },
        },
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get audit logs by resource
   * GET /api/audit/resource/:resource/:resourceId
   * Company isolation: Users can only see logs for resources in their company
   */
  getAuditLogsByResource = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { resource, resourceId } = req.params;
      const userRole = req.user.role as Role;
      const userCompanyId = req.user.companyId;

      // Get all logs for the resource
      let logs = await this.repository.findByResource(resource, resourceId);

      // Company isolation: Filter by company for non-admin/government users
      if (userRole !== Role.ADMIN && userRole !== Role.GOVERNMENT) {
        if (!userCompanyId) {
          res.status(403).json({
            success: false,
            error: 'User must belong to a company',
            requestId: getRequestId(req),
          });
          return;
        }
        // Filter logs to only include those from user's company
        logs = logs.filter((log: any) => {
          const logCompanyId = log.companyId?._id?.toString() || log.companyId?.toString();
          return logCompanyId === userCompanyId.toString();
        });
      }

      const response: ApiResponse = {
        success: true,
        data: {
          logs,
          pagination: {
            total: logs.length,
            limit: logs.length,
            skip: 0,
          },
        },
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get audit logs by user
   * GET /api/audit/user/:userId
   * Company isolation: Users can only see logs for users in their company
   */
  getAuditLogsByUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { userId } = req.params;
      const { limit } = req.query;
      const userRole = req.user.role as Role;
      const userCompanyId = req.user.companyId;

      // Get logs for the user
      let logs = await this.repository.findByUser(
        userId,
        limit ? parseInt(limit as string, 10) : 100
      );

      // Company isolation: Filter by company for non-admin/government users
      if (userRole !== Role.ADMIN && userRole !== Role.GOVERNMENT) {
        if (!userCompanyId) {
          res.status(403).json({
            success: false,
            error: 'User must belong to a company',
            requestId: getRequestId(req),
          });
          return;
        }
        // Filter logs to only include those from user's company
        logs = logs.filter((log: any) => {
          const logCompanyId = log.companyId?._id?.toString() || log.companyId?.toString();
          return logCompanyId === userCompanyId.toString();
        });
      }

      const response: ApiResponse = {
        success: true,
        data: logs,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get audit logs by company
   * GET /api/audit/company/:companyId
   * Company isolation: Users can only access their own company's logs
   */
  getAuditLogsByCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { companyId } = req.params;
      const { limit } = req.query;
      const userRole = req.user.role as Role;
      const userCompanyId = req.user.companyId;

      // Company isolation: Non-admin/government users can only access their own company
      if (userRole !== Role.ADMIN && userRole !== Role.GOVERNMENT) {
        if (!userCompanyId) {
          res.status(403).json({
            success: false,
            error: 'User must belong to a company',
            requestId: getRequestId(req),
          });
          return;
        }
        if (companyId !== userCompanyId.toString()) {
          res.status(403).json({
            success: false,
            error: 'Access denied: Can only view audit logs for your own company',
            requestId: getRequestId(req),
          });
          return;
        }
      }

      const logs = await this.repository.findByCompany(
        companyId,
        limit ? parseInt(limit as string, 10) : 100
      );

      const response: ApiResponse = {
        success: true,
        data: logs,
        requestId: getRequestId(req),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export audit logs
   * GET /api/audit/export?format=pdf|excel|csv&...
   * Generates PDF or Excel reports for legal compliance
   */
  exportAuditLogs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { format = 'pdf' } = req.query;
      const {
        userId,
        companyId,
        action,
        resource,
        resourceId,
        status,
        startDate,
        endDate,
      } = req.query;

      const userRole = req.user.role as Role;
      const userCompanyId = req.user.companyId;

      const filters: AuditLogFilters = {};
      
      // Company isolation: Non-admin/government users can only see their company's logs
      if (userRole !== Role.ADMIN && userRole !== Role.GOVERNMENT) {
        if (!userCompanyId) {
          res.status(403).json({
            success: false,
            error: 'User must belong to a company',
            requestId: getRequestId(req),
          });
          return;
        }
        filters.companyId = userCompanyId;
      } else {
        if (companyId) {
          filters.companyId = companyId as string;
        }
      }

      if (userId) filters.userId = userId as string;
      if (action) filters.action = action as string;
      if (resource) filters.resource = resource as string;
      if (resourceId) filters.resourceId = resourceId as string;
      if (status) filters.status = status as 'success' | 'failure';
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      // Get all matching logs (no pagination for export)
      const logs = await this.repository.find(filters, 10000, 0);

      // Generate export
      let buffer: Buffer;
      let contentType: string;
      let filename: string;

      if (format === 'pdf') {
        buffer = await this.exportService.exportToPDF(logs, {
          format: 'pdf',
          filters: {
            startDate: filters.startDate,
            endDate: filters.endDate,
            companyId: filters.companyId,
            userId: filters.userId,
            action: filters.action,
            resource: filters.resource,
          },
        });
        contentType = 'application/pdf';
        filename = `audit-trail-${new Date().toISOString()}.pdf`;
      } else if (format === 'excel' || format === 'xlsx') {
        buffer = await this.exportService.exportToExcel(logs, {
          format: 'excel',
          filters: {
            startDate: filters.startDate,
            endDate: filters.endDate,
            companyId: filters.companyId,
            userId: filters.userId,
            action: filters.action,
            resource: filters.resource,
          },
        });
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `audit-trail-${new Date().toISOString()}.xlsx`;
      } else {
        // CSV
        const csvContent = await this.exportService.exportToCSV(logs, {
          format: 'csv',
          filters: {
            startDate: filters.startDate,
            endDate: filters.endDate,
            companyId: filters.companyId,
            userId: filters.userId,
            action: filters.action,
            resource: filters.resource,
          },
        });
        buffer = Buffer.from(csvContent, 'utf8');
        contentType = 'text/csv';
        filename = `audit-trail-${new Date().toISOString()}.csv`;
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length.toString());
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  };
}
