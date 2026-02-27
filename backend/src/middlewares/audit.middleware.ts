import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuditLogRepository } from '../modules/audit/repository';
import { AuditAction, AuditResource } from '../modules/audit/schema';
import { getRequestId } from '../utils/requestId';
import { logger } from '../utils/logger';

/**
 * Map HTTP methods to audit actions
 */
const methodToAction: Record<string, AuditAction> = {
  GET: AuditAction.VIEW,
  POST: AuditAction.CREATE,
  PATCH: AuditAction.UPDATE,
  PUT: AuditAction.UPDATE,
  DELETE: AuditAction.DELETE,
};

/**
 * Map route paths to audit resources
 */
const pathToResource = (path: string): AuditResource | null => {
  if (path.includes('/users')) return AuditResource.USER;
  if (path.includes('/companies')) return AuditResource.COMPANY;
  if (path.includes('/purchase-requests')) return AuditResource.PURCHASE_REQUEST;
  if (path.includes('/rfqs')) return AuditResource.RFQ;
  if (path.includes('/bids')) return AuditResource.BID;
  if (path.includes('/contracts')) return AuditResource.CONTRACT;
  if (path.includes('/shipments')) return AuditResource.SHIPMENT;
  if (path.includes('/payments')) return AuditResource.PAYMENT;
  if (path.includes('/disputes')) return AuditResource.DISPUTE;
  if (path.includes('/analytics')) return AuditResource.ANALYTICS;
  if (path.includes('/audit')) return AuditResource.AUDIT_LOG;
  return null;
};

/**
 * Extract action from route path (e.g., /approve, /reject, /sign)
 */
const extractActionFromPath = (path: string, method: string): AuditAction | null => {
  if (path.includes('/approve')) return AuditAction.APPROVE;
  if (path.includes('/reject')) return AuditAction.REJECT;
  if (path.includes('/submit')) return AuditAction.SUBMIT;
  if (path.includes('/sign')) return AuditAction.SIGN;
  if (path.includes('/escalate')) return AuditAction.ESCALATE;
  if (path.includes('/resolve')) return AuditAction.RESOLVE;
  if (path.includes('/process')) return AuditAction.PROCESS;
  if (path.includes('/activate')) return AuditAction.ACTIVATE;
  if (path.includes('/withdraw')) return AuditAction.WITHDRAW;
  if (path.includes('/evaluate')) return AuditAction.EVALUATE;
  return methodToAction[method] || null;
};

/**
 * Audit middleware to log all API requests
 */
export const auditMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Skip audit for health checks and non-authenticated routes
  if (
    req.path === '/health' ||
    req.path === '/api/health' ||
    req.path.startsWith('/api/auth/login') ||
    req.path.startsWith('/api/auth/register')
  ) {
    next();
    return;
  }

  // Skip if user is not authenticated
  if (!req.user) {
    next();
    return;
  }

  const auditRepo = new AuditLogRepository();
  const startTime = Date.now();
  const originalSend = res.send;

  // Capture response
  res.send = function (body: unknown) {
    // Skip if user is not authenticated (double check)
    if (!req.user) {
      return originalSend.call(this, body);
    }

    const duration = Date.now() - startTime;
    const status = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failure';

    // Extract resource and action
    const resource = pathToResource(req.path);
    const action = extractActionFromPath(req.path, req.method) || methodToAction[req.method] || AuditAction.VIEW;

    // Extract resource ID from params
    const resourceId = req.params.id || req.params.userId || req.params.companyId || undefined;

    // Prepare audit log data
    const auditData = {
      userId: new mongoose.Types.ObjectId(req.user.userId),
      companyId: req.user.companyId ? new mongoose.Types.ObjectId(req.user.companyId) : undefined,
      action,
      resource: resource || AuditResource.USER, // Default to USER if not found
      resourceId: resourceId ? new mongoose.Types.ObjectId(resourceId) : undefined,
      details: {
        changes: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          query: Object.keys(req.query).length > 0 ? req.query : undefined,
        },
      },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
      requestId: getRequestId(req),
      status: status as 'success' | 'failure',
      errorMessage: status === 'failure' && typeof body === 'string' ? body.substring(0, 500) : undefined,
    };

    // Log audit entry asynchronously (don't block response)
    auditRepo.create(auditData).catch((error) => {
      logger.error('Failed to create audit log:', error);
    });

    return originalSend.call(this, body);
  };

  next();
};

/**
 * Create audit log entry manually (for complex operations)
 */
export const createAuditLog = async (
  userId: string,
  companyId: string | undefined,
  action: AuditAction,
  resource: AuditResource,
  details: {
    resourceId?: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    changes?: Record<string, unknown>;
    [key: string]: unknown;
  },
  status: 'success' | 'failure' = 'success',
  errorMessage?: string
): Promise<void> => {
  const auditRepo = new AuditLogRepository();
  try {
    await auditRepo.create({
      userId: userId as any,
      companyId: companyId as any,
      action,
      resource,
      resourceId: details.resourceId as any,
      details: {
        before: details.before,
        after: details.after,
        changes: details.changes,
      },
      status,
      errorMessage,
    });
  } catch (error) {
    logger.error('Failed to create audit log:', error);
  }
};
